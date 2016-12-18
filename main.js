(function() {
    const options = {
        commentLimit: 10,
        commentSort: 'best'
    }

    document.addEventListener('DOMContentLoaded', function() {
        chrome.tabs.getSelected(null, function(tab) {
            let tablink = tab.url,
                q = encodeURI(`(url:'${tablink}')`),
                url = `https://api.reddit.com/search.json?q=${q}`

            Request.load(url, function(response) {
                let json = JSON.parse(response).data,
                    threads = json.children;

                if (threads.length <= 0) {
                    l('tabs-container').innerHTML = "Couldn't find any posts for this page!";
                }

                threads.forEach(thread => new Thread(thread));
            });
        });
    });

    class Util {
        static getDuration(millis) {
            let times = [
                [m => ~~(m / 31536000000), " year"],
                [m => ~~(m / 2592000000), " month"],
                [m => ~~(m / 86400000), " day"],
                [m => ~~((m / 3600000) % 24), " hour"],
                [m => ~~((m / 60000) % 60), " minute"],
                [m => ~~((m / 1000) % 60), " second"],
            ]

            let ret;
            times.some((a) => {
                let t = a[0](millis);
                if (t > 0) {
                    ret = t + a[1] + (t > 1 ? "s" : "");
                    return true;
                }
            });

            return ret;
        }
    }

    class Request {
        static load(url, callback) {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);

            xhr.onload = function() {
                if (callback) callback(xhr.responseText);
            }
            xhr.send();
        }
    }

    class Thread {
        constructor(data) {
            this.children = [];
            this.data = data.data;

            let temp = document.createElement("div");
            temp.innerHTML = `<div class='tab' id='${this.data.id}_tab'>${this.data.subreddit}</div>`;
            l('tabs-container').appendChild(temp.children[0]);

            this.tab = l(this.data.id + '_tab');
            this.tab.addEventListener("click", this.loadComments.bind(this), false);
        }
        loadComments() {
            let selected = document.getElementsByClassName('selected');
            for (let i = 0; i < selected.length; i++) {
                selected[i].classList.remove('selected');
            }
            this.tab.classList.add('selected');

            let _this = this,
                sub = _this.data.subreddit,
                id = _this.data.id,
                pUrl = `https://api.reddit.com/r/${sub}/comments/${id}.json?sort=${options.commentSort}&limit=${options.commentLimit}`;

            l('stories').innerHTML =
                `<div class='story' id='${_this.data.id}'>
				 	 <div class='title'>
						 <a target='_blank' href='http://reddit.com${_this.data.permalink}'>${_this.data.title}</a>
					 </div>
					 <div class='comments' id='${_this.data.id}_comments'></div>
				 </div>`;

            Request.load(pUrl, function(r) {
                let result = JSON.parse(r),
                    thread = result[0].data.children[0].data,
                    comments = result[1].data.children;

                if (comments.length === 0) {
                    l(id + '_comments').innerHTML = "Couldn't find any comments for this post!";
                }
                comments.forEach(comment => _this.children.push(new Comment(thread.id, comment)));

                window.scrollTo(0, document.getElementById(_this.data.id).offsetTop);
            });
        }
    }

    class Comment {
        constructor(parentId, comment, parent) {
            if (!comment.data.body) return;

            let body = SnuOwnd.getParser().render(comment.data.body),
                elem = parent ? l(parent.split("_")[1]).getElementsByClassName('body')[0] : l(parentId + '_comments');

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

            div.getElementsByClassName("minimizer")[0].addEventListener("click", function() {
                div.classList.toggle("hidden");
                div.getElementsByClassName("body")[0].classList.toggle("hidden");
            });

            elem.appendChild(div);

            let replies = comment.data.replies;

            if (replies != "") {
                let children = replies.data.children;
                for (let i = 0; i < children.length; i++) {
                    new Comment(parentId, children[i], children[i].data.parent_id);
                }
            }
        }
    }

    function l(id) {
        return document.getElementById(id);
    }
})();
