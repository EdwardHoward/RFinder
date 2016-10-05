document.addEventListener('DOMContentLoaded', function(){
	chrome.tabs.getSelected(null, function(tab){
		var tablink = tab.url;
		var q = encodeURI("(url:\""+tablink+"\")");

		var url = "https://api.reddit.com/search.json?q="+q;

		Request.loadUrl(url, function(response){
			var json = JSON.parse(response).data;
			var threads = json.children;
			for(var i = 0; i < threads.length; i++){
				if(threads[i].data.url !== "undefined"){
					new Thread(threads[i]);
				}
			}
		});
	});
});

function l(id){
	return document.getElementById(id);
}

var Request = (function(){
	var Request = {};
	Request.loadUrl = function(url, callback){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);

		xhr.onload = function(){
			if(callback) callback(xhr.responseText);
		}
		xhr.send();
	}
	return Request;
})();

var Thread = (function(){

	function Thread(threadData){
		var _this = this;

		_this.children = new Array();
		_this.threadData = threadData.data;

		var temp = document.createElement("div");
		temp.innerHTML = "<div class='tab' id='"+_this.threadData.id+"_tab'>"+_this.threadData.subreddit+"</div>";
		l('tabs-container').appendChild(temp.children[0]);
		l(_this.threadData.id+'_tab').addEventListener("click", _this.loadComments.bind(_this), false);
	}

	Thread.prototype.loadComments = function() {
		var _this = this,
			sub = _this.threadData.subreddit,
			id = _this.threadData.id,
			pUrl = "https://api.reddit.com/r/"+sub+"/comments/"+id+".json?sort=confidence&limit=10";

		var temp = document.createElement("div");
		var html = "<div class='story' id='"+_this.threadData.id+"'>"+
				"<div class='title'><a href='http://reddit.com"+_this.threadData.permalink+"'> "+_this.threadData.title+"</a></div>"+
				"<div class='comments' id='"+_this.threadData.id+"_comments'>" +
				"</div></div>";
		temp.innerHTML = html;
		var story = temp.children[0];
		l('stories').innerHTML = html//.appendChild(story);//.innerHTML += html;
		_this.template = l(_this.threadData.id);

		Request.loadUrl(pUrl, function(r){
			var threadInfo = JSON.parse(r);
			var threadDatas = threadInfo[0].data.children[0].data;
			var commentData = threadInfo[1].data.children;
			for(var i = 0; i < commentData.length; i++){
				_this.children.push(new Comment(threadDatas.id, commentData[i]));
			}
		});
	};
	return Thread;
})();

var Comment = (function(){
	function Comment(parentId, comment, parent){
		if(!comment.data.body) return;

		var value = SnuOwnd.getParser().render(comment.data.body);
		var elem = l(parent ? parent.split("_")[1] : parentId+'_comments');

		elem.innerHTML += "<div class='comment' id="+comment.data.id+"><div class='info'><span class='minimizer'>[-]</span><span> "+comment.data.author+" </span></div>"+value+"</div>";

		var replies = comment.data.replies;

		if(replies != ""){
			var children = replies.data.children;
			for(var i = 0; i < children.length; i++){
				new Comment(parentId, children[i], children[i].data.parent_id);
			}
		}
	}
	return Comment;
})();
