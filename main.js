(function() {
    const options = {
        commentLimit: 10,
        commentSort: 'best'
    }
    document.addEventListener('DOMContentLoaded', function() {
        chrome.tabs.getSelected(null, function(tab) {
            var tablink = tab.url,
				q = encodeURI(`(url:'${tablink}')`),
				url = `https://api.reddit.com/search.json?q=${q}`

            Request.loadUrl(url, function(response) {
                var json = JSON.parse(response).data,
					threads = json.children;

                if (threads.length <= 0)
					l('tabs-container').innerHTML = "Couldn't find any posts for this page!";

                for (var i = 0; i < threads.length; i++) {
                    if (threads[i].data.url !== "undefined") {
                        new Thread(threads[i]);
                    }
                }
            });
        });
    });

    var Request = (function() {
        return {
            loadUrl(url, callback) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);

                xhr.onload = function() {
                    if (callback) callback(xhr.responseText);
                }
                xhr.send();
            }
        };
    })();

	class Thread {
		constructor(threadData){
			this.children = [];
			this.threadData = threadData.data;

			var temp = document.createElement("div");
			temp.innerHTML = `<div class='tab' id='${this.threadData.id}_tab'>${this.threadData.subreddit}</div>`;
			l('tabs-container').appendChild(temp.children[0]);
			l(this.threadData.id + '_tab').addEventListener("click", this.loadComments.bind(this) , false);
		}
		loadComments() {
			var _this = this,
				sub = _this.threadData.subreddit,
				id = _this.threadData.id,
				pUrl = `https://api.reddit.com/r/${sub}/comments/${id}.json?sort=${options.commentSort}&limit=${options.commentLimit}`;

			l('stories').innerHTML =
				`<div class='story' id='${_this.threadData.id}'>
				 	 <div class='title'>
						 <a target='_blank' href='http://reddit.com${_this.threadData.permalink}'>${_this.threadData.title}</a>
					 </div>
					 <div class='comments' id='${_this.threadData.id}_comments'></div>
				 </div>`;

			Request.loadUrl(pUrl, function(r) {
				var threadInfo = JSON.parse(r),
					threadDatas = threadInfo[0].data.children[0].data,
					commentData = threadInfo[1].data.children;

				for (var i = 0; i < commentData.length; i++) {
					_this.children.push(new Comment(threadDatas.id, commentData[i]));
				}
			});
		}
	}

	class Comment{
		constructor(parentId, comment, parent){
			if (!comment.data.body) return;

	        var body = SnuOwnd.getParser().render(comment.data.body);
	        var elem = l(parent ? parent.split("_")[1] : parentId + '_comments');

			elem.innerHTML +=
				`<div class='comment' id='${comment.data.id}'>
					<div class='info'>
						<span class='minimizer'>[-]</span>
						<span>${comment.data.author}</span>
					</div>
					${body}
				 </div>`

	        var replies = comment.data.replies;

	        if (replies != "") {
	            var children = replies.data.children;
	            for (var i = 0; i < children.length; i++) {
	                new Comment(parentId, children[i], children[i].data.parent_id);
	            }
	        }
		}
	}

	function l(id) {
		return document.getElementById(id);
	}
})();
