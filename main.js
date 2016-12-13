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

            Request.load(url, function(response) {
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

	class Util {
		static getDuration(millis){
			let times = [
				[(m) => ~~(m / (1000 * 60 * 60 * 24 * 365)), " year"],
				[(m) => ~~(m / (1000 * 60 * 60 * 24 * 30)), " month"],
				[(m) => ~~(m / (1000 * 60 * 60 * 24)), " day"],
				[(m) => ~~((m / (1000 * 60 * 60)) % 24), " hour"],
				[(m) => ~~((m) / (1000 * 60) % 60), " minute"],
				[(m) => ~~((m / 1000) % 60), " second"],
			]

			let ret;
			times.some((a) => {
				let t = a[0](millis);
				if(t > 0){
					ret = t + (t > 1 ? a[1]+"s" : a[1]);
					return true;
				}
			});

			return ret;
		}
	}

	class Request {
		static load(url, callback){
			var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);

            xhr.onload = function() {
                if (callback) callback(xhr.responseText);
            }
            xhr.send();
		}
	}

    class Thread {
        constructor(threadData) {
            this.children = [];
            this.threadData = threadData.data;

            var temp = document.createElement("div");
            temp.innerHTML = `<div class='tab' id='${this.threadData.id}_tab'>${this.threadData.subreddit}</div>`;
            l('tabs-container').appendChild(temp.children[0]);
            l(this.threadData.id + '_tab').addEventListener("click", this.loadComments.bind(this), false);
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

            Request.load(pUrl, function(r) {
                var threadInfo = JSON.parse(r),
                    threadDatas = threadInfo[0].data.children[0].data,
                    commentData = threadInfo[1].data.children;

                for (var i = 0; i < commentData.length; i++) {
                    _this.children.push(new Comment(threadDatas.id, commentData[i]));
                }

				window.scrollTo(0, document.getElementById(_this.threadData.id).offsetTop);
            });
        }
    }

    class Comment {
        constructor(parentId, comment, parent) {
            if (!comment.data.body) return;

            var body = SnuOwnd.getParser().render(comment.data.body);
			let elem;
			if(parent){
				elem = l(parent.split("_")[1]).getElementsByClassName('body')[0];
			}else{
				elem = l(parentId + '_comments');
			}

			let duration = Util.getDuration(Date.now() - (comment.data.created_utc * 1000)),
				createdDate = new Date(comment.data.created_utc * 1000),
				div = document.createElement("div");

			div.classList.add('comment');
			div.id = comment.data.id;

			div.innerHTML +=
				`<div class='info'>
					<span class='minimizer'>[<span class="minimizer-icon"></span>]</span>
					<span class="comment-author"><a target='_blank' href="http://reddit.com/user/${comment.data.author}">${comment.data.author}</a></span><span class="comment-score">${comment.data.score} points</span><span>-</span><span class="comment-duration" title="${createdDate}">${duration} ago</span>
				</div>
				<div class='body' id=${comment.data.id}_body>${body}</div>`;

			div.getElementsByClassName("minimizer")[0].addEventListener("click", function(){
				div.classList.toggle("hidden");
				div.getElementsByClassName("body")[0].classList.toggle("hidden");
			});

			elem.appendChild(div);

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
