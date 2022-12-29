import re
from flask import render_template, url_for, flash, redirect, request, abort, Blueprint, make_response, jsonify
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import Post, PostCache, Media, Comment, Collection
from flaskblog.posts.forms import PostForm, CommentForm
from flaskblog.posts.utils import save_file, allowed_file, limit_content_posts


posts = Blueprint('posts', __name__)

MEDIA_CODE = '*/#|>'
EMPTY_CODE = ':*EMPTY*:'

quantity = 15
comments = []


@posts.route("/post/caches", methods=["GET", "POST"])
@login_required
def post_caches():
	if request.method == "GET":
		user_post_caches = PostCache.query.filter_by(user_id=current_user.id).order_by(
			PostCache.date_cached.desc()).all()

		limit_content = {}
		for post_cache in user_post_caches:
			splinted_raw = re.split('{{|}}', post_cache.content)

			splinted = []
			for i, splint in enumerate(splinted_raw):
				if splint == '' or "*/#|>" in splint or EMPTY_CODE in splint:
					continue
				else:
					splinted.append(splint)

			if len(splinted) >= 1:
				if len(splinted[0].split()) < 17:
					limit_content[post_cache.id] = splinted[0].split('\n')[0]
				else:
					limit_content[post_cache.id] = splinted[0] + '...'
			else:
				limit_content[post_cache.id] = None

		return render_template('post_caches.html', title='Post Caches', user_post_caches=user_post_caches,
							   limit_content=limit_content)
	elif request.method == "POST":
		post_cache_id = request.json['post_cache_id']
		post_cache = PostCache.get_or_404(post_cache_id)

		if post_cache.user_id == current_user.id:
			db.session.delete(post_cache)
			db.session.commit()
			return make_response(jsonify('success'))
		else:
			return make_response(jsonify('failure'))


@posts.route("/post/new", methods=["GET", "POST"])
@login_required
def new_post():
	post_form = PostForm()
	post_cache_id = request.args.get('post_cache_id')

	if post_cache_id:
		post_cache = PostCache.query.filter_by(id=post_cache_id, user_id=current_user.id).first()

		if not post_cache:
			abort(404)
	else:
		post_cache = PostCache(user_id=current_user.id, title="", content=f'{{{{{EMPTY_CODE}}}}}')
		db.session.add(post_cache)
		db.session.commit()
		return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))

	if request.method == "GET":
		if post_cache:
			splinted = re.split('{{|}}', post_cache.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)

			for i, splint in enumerate(splinted):
				if splint == EMPTY_CODE:
					if len(splinted) > i + 1:
						if splinted[i+1] == EMPTY_CODE:
							splinted.pop(i+1)

			post_form.title.data = post_cache.title
			uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())
			return render_template('create_post.html', title='New Post', post_cache_id=post_cache.id,
								   post_form=post_form, uploaded_media=uploaded_media, splinted=splinted)
	elif request.method == "POST":
		unsorted_items = []
		for item in request.form:
			if item.isdigit():
				unsorted_items.append(int(item))

		unsorted_items.sort()

		items = {}
		for item in unsorted_items:
			items[item] = request.form.get(str(item))

		post_cache.title = post_form.title.data
		post_cache.content = ""
		for item_id in items:
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				media_size = request.form.get(f'size-{item_id}')
				edited_item_name = f'{{{{{found_media.file}|:{media_size}:|{MEDIA_CODE}}}}}'
				post_cache.content += edited_item_name
			elif items[item_id] != '':
				post_cache.content += items[item_id]
			else:
				post_cache.content += f'{{{{{EMPTY_CODE}}}}}'

		if post_form.import_file.data:
			if 'import_file' not in request.files:
				flash('No file part')

			blob = request.files['import_file'].read()
			size = len(blob)
			if size > 1024 * 1024 * 5:
				flash('Uploads must be under 5 Megabytes', 'danger')
				return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))

			file = post_form.import_file.data

			if file.filename == '':
				flash('No selected file')
			if file and allowed_file(file.filename):
				uploaded_file_path = save_file(file)
				uploaded_file = Media(user_id=current_user.id, file=uploaded_file_path)

				edited_file_path = f'{{{{{uploaded_file_path}|:50:|{MEDIA_CODE}}}}}'

				post_cache.content += edited_file_path + f'{{{{{EMPTY_CODE}}}}}'

				db.session.add(uploaded_file)
				db.session.commit()
				return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.file.data:
			post_cache.content += f'{{{{{post_form.file.data}|:50:|{MEDIA_CODE}}}}}' + f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.add_empty.data and post_form.validate():
			post_cache.content += f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.submit.data and post_form.validate():
			created_post = Post(title=post_cache.title, content=post_cache.content, author=current_user)
			db.session.delete(post_cache)
			db.session.add(created_post)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=created_post.id))
		else:
			post_cache.title = post_form.title.data
			db.session.commit()

		return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))


@posts.route('/post/save', methods=['POST'])
@login_required
def save_post():
	post_cache_id = request.args.get('post_cache_id')
	post_cache = PostCache.query.get_or_404(post_cache_id)

	if post_cache.user_id == current_user.id:
		all_items = request.json
		post_cache.title = all_items['title']
		post_cache.content = ""

		unsorted_items = []
		for item in all_items:
			if item.isdigit():
				unsorted_items.append(int(item))

		unsorted_items.sort()

		items = {}
		for item in unsorted_items:
			items[item] = request.json[str(item)]

		for item_id in items:
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				media_size = all_items[f'size-{item_id}']
				edited_item_name = f'{{{{{found_media.file}|:{media_size}:|{MEDIA_CODE}}}}}'
				post_cache.content += edited_item_name
			elif items[item_id] != '':
				post_cache.content += items[item_id]
			else:
				post_cache.content += f'{{{{{EMPTY_CODE}}}}}'

		db.session.commit()
		return make_response(jsonify('success'))
	else:
		return make_response(jsonify('failure'))


@posts.route("/post/delete_media", methods=['POST'])
@login_required
def delete_media():
	media_id = request.json.get('media_id')

	found_media = Media.query.filter_by(user_id=current_user.id, id=media_id).first()

	if found_media:
		db.session.delete(found_media)
		db.session.commit()
		return make_response(jsonify('success'))
	else:
		return make_response(jsonify('failure'))


@posts.route("/post/<int:post_id>", methods=["GET", "POST"])
def post(post_id):
	post = Post.query.get_or_404(post_id)

	if request.method == "GET":
		comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.date_posted.desc())
		# order_by(Comment.likes.desc()) Once again, random or 'relevant'

		# global comments
		# comments = []
		# for comment in Comment.query.filter_by(post_id=post_id):
		# 	comments.append(comment.as_dict())

		post_comment_form = CommentForm()
		comment_comment_form = CommentForm()

		post_liked_status = 'undefined'
		if current_user.is_authenticated:
			# Post View
			if post in current_user.posts_viewed:
				current_user.posts_viewed.remove(post)
				db.session.commit()

			current_user.posts_viewed.append(post)

			# Post Like
			if post in current_user.posts_liked:
				post_liked_status = 'liked'
			elif post in current_user.posts_disliked:
				post_liked_status = 'disliked'

		post_splinted = re.split('{{|}}', post.content)

		for i, splint in enumerate(post_splinted):
			if splint == '':
				post_splinted.pop(i)

		post.views += 1
		db.session.commit()

		# Recommended Posts
		recommended_posts = Post.query.filter(Post.id != post_id).order_by(Post.views.desc()).limit(50).all()
		# Filter by tags similar to this one, user similar to post user (tag + user > user > tag)

		limit_content = {}
		for recommended_post in recommended_posts:
			splinted = re.split('{{|}}', recommended_post.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)
				elif '*/#|>' in splint:
					splinted.pop(i)

			if len(splinted[0].split()) > 17:
				limit_content[recommended_post.id] = splinted[0].split('\n')[0]
			else:
				limit_content[recommended_post.id] = splinted[0] + '...'

		# Collection
		list_arg = request.args.get("list")
		collection = None

		if list_arg:
			if list_arg == 'RL':
				collection = Collection.query.filter_by(user_id=current_user.id, type='RL').first()
			else:
				collection = Collection.query.get_or_404(list_arg)

				if collection.type == 'RL':
					return redirect(url_for('posts.post', post_id=post.id, list='RL'))

		if collection:
			for collection_post in collection.posts:
				splinted = re.split('{{|}}', collection_post.content)

				for i, splint in enumerate(splinted):
					if splint == '':
						splinted.pop(i)
					elif '*/#|>' in splint:
						splinted.pop(i)

				if len(splinted[0].split()) > 17:
					limit_content[collection_post.id] = splinted[0].split('\n')[0]
				else:
					limit_content[collection_post.id] = splinted[0] + '...'

		return render_template("post.html", title=post.title, post=post, post_splinted=post_splinted, comments=comments,
							   post_comment_form=post_comment_form, comment_comment_form=comment_comment_form,
							   post_liked_status=post_liked_status, recommended_posts=recommended_posts,
							   list_arg=list_arg, collection=collection, limit_content=limit_content)
	elif request.method == "POST" and current_user.is_authenticated:
		action = request.args.get("action", type=str)

		if action == "like":
			like_action = request.json.get("action")
			comment_id = request.json.get("comment_id")
			liked_status = "undefined"

			if comment_id:
				# Liking Comment
				comment = Comment.query.get_or_404(comment_id)

				if comment in current_user.comments_liked:
					liked_status = "liked"
				elif comment in current_user.comments_disliked:
					liked_status = "disliked"

				if like_action == "like":
					if liked_status == "liked":
						current_user.comments_liked.remove(comment)
					elif liked_status == "undefined":
						current_user.comments_liked.append(comment)
					elif liked_status == "disliked":
						current_user.comments_disliked.remove(comment)
						current_user.comments_liked.append(comment)

				elif like_action == "dislike":
					if liked_status == "disliked":
						current_user.comments_disliked.remove(comment)
					elif liked_status == "undefined":
						current_user.comments_disliked.append(comment)
					elif liked_status == "liked":
						current_user.comments_liked.remove(comment)
						current_user.comments_disliked.append(comment)

				db.session.commit()
				return make_response(jsonify({"status": "success", "previous_liked_status": liked_status}))
			else:
				# Liking Post
				if post in current_user.posts_liked:
					liked_status = "liked"
				elif post in current_user.posts_disliked:
					liked_status = "disliked"

				if like_action == "like":
					if liked_status == "liked":
						current_user.posts_liked.remove(post)
					elif liked_status == "undefined":
						current_user.posts_liked.append(post)
					elif liked_status == "disliked":
						current_user.posts_disliked.remove(post)
						current_user.posts_liked.append(post)

				elif like_action == "dislike":
					if liked_status == "disliked":
						current_user.posts_disliked.remove(post)
					elif liked_status == "undefined":
						current_user.posts_disliked.append(post)
					elif liked_status == "liked":
						current_user.posts_liked.remove(post)
						current_user.posts_disliked.append(post)

				db.session.commit()
				return make_response(jsonify({"status": "success", "previous_liked_status": liked_status}))
		elif action == "comment":
			comment_id = request.args.get('comment_id')

			post.views -= 1

			if comment_id:
				# Commenting under another comment
				comment_comment_form = CommentForm()
				comment = Comment.query.get_or_404(comment_id)

				if comment_comment_form.validate_on_submit():
					created_comment = Comment(content=comment_comment_form.content.data, author=current_user,
											  parent=Post.query.get(post.id), comment_id=comment.id)

					db.session.add(created_comment)
					db.session.commit()
					return redirect(url_for('posts.post', post_id=post.id))
			else:
				# Commenting directly to post
				post_comment_form = CommentForm()

				if post_comment_form.validate_on_submit():
					created_comment = Comment(content=post_comment_form.content.data, author=current_user,
											  parent=post)

					db.session.add(created_comment)
					db.session.commit()
					return redirect(url_for('posts.post', post_id=post.id))
		elif action == "delete":
			if post.user_id == current_user.id:
				Comment.query.filter_by(post_id=post.id).delete()

				db.session.delete(post)
				db.session.commit()
				flash("Post Deleted", "success")
				return redirect(url_for("main.home"))


# Infinite load comments (When Implement)
# @posts.route('/load_comments', methods=['POST'])
# def load_comments():
# 	if request.args:
# 		counter = int(request.args.get('c'))
# 		if counter == 0:
# 			res = make_response(jsonify(comments[0: quantity]), 200)
# 		elif counter > len(comments) + quantity:
# 			res = make_response(jsonify({}), 200)
# 		else:
# 			res = make_response(jsonify(comments[quantity: quantity + counter]), 200)
#
# 	return res


@posts.route("/post/<int:post_id>/update", methods=["GET", "POST"])
@login_required
def update_post(post_id):
	post = Post.query.filter_by(id=post_id, author=current_user).first()

	if not post:
		abort(404)

	post_temp_cache = PostCache.query.filter_by(post_id=post.id, user_id=current_user.id).first()

	if not post_temp_cache:
		post_temp_cache = PostCache(user_id=current_user.id, post_id=post.id, title=post.title, content=post.content)
		db.session.add(post_temp_cache)
		db.session.commit()

	post_form = PostForm()
	if request.method == "GET":
		if post_temp_cache:
			splinted = re.split('{{|}}', post_temp_cache.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)

			for i, splint in enumerate(splinted):
				if splint == EMPTY_CODE:
					if len(splinted) > i + 1:
						if splinted[i + 1] == EMPTY_CODE:
							splinted.pop(i + 1)

			post_form.title.data = post_temp_cache.title
			uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())
			return render_template('update_post.html', title='Update Post', post_id=post.id, post_form=post_form,
								   uploaded_media=uploaded_media, splinted=splinted, post_cache_id=post_temp_cache.id)
		else:
			splinted = re.split('{{|}}', post.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)

			for i, splint in enumerate(splinted):
				if splint == EMPTY_CODE:
					if len(splinted) > i + 1:
						if splinted[i + 1] == EMPTY_CODE:
							splinted.pop(i + 1)

			post_form.title.data = post.title
			uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())
			return render_template('update_post.html', title='Update Post', post_id=post.id, post_form=post_form,
								   uploaded_media=uploaded_media, splinted=splinted)
	elif request.method == "POST":
		if request.args.get("action", type=str) == "delete":
			if post_temp_cache:
				db.session.delete(post_temp_cache)
				db.session.commit()
				return ''

		unsorted_items = []
		for item in request.form:
			if item.isdigit():
				unsorted_items.append(int(item))

		unsorted_items.sort()

		items = {}
		for item in unsorted_items:
			items[item] = request.form.get(str(item))

		post_temp_cache.title = post_form.title.data
		post_temp_cache.content = ""
		for item_id in items:
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				media_size = request.form.get(f'size-{item_id}')
				edited_item_name = f'{{{{{found_media.file}|:{media_size}:|{MEDIA_CODE}}}}}'
				post_temp_cache.content += edited_item_name
			elif items[item_id] != '':
				post_temp_cache.content += items[item_id]
			else:
				post_temp_cache.content += f'{{{{{EMPTY_CODE}}}}}'

		if post_form.import_file.data:
			if 'import_file' not in request.files:
				flash('No file part')

			blob = request.files['import_file'].read()
			size = len(blob)
			if size > 1024 * 1024 * 5:
				flash('Uploads must be under 5 Megabytes', 'danger')
				return redirect(url_for('posts.update_post', post_id=post.id))

			file = post_form.import_file.data

			if file.filename == '':
				flash('No selected file')
			if file and allowed_file(file.filename):
				uploaded_file_path = save_file(file)
				uploaded_file = Media(user_id=current_user.id, file=uploaded_file_path)

				edited_file_path = f'{{{{{uploaded_file_path}|:50:|{MEDIA_CODE}}}}}'

				post_temp_cache.content += edited_file_path + f'{{{{{EMPTY_CODE}}}}}'

				db.session.add(uploaded_file)
				db.session.commit()
				return redirect(url_for('posts.update_post', post_id=post.id))
		elif post_form.file.data:
			post_temp_cache.content += f'{{{{{post_form.file.data}|:50:|{MEDIA_CODE}}}}}' + f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.update_post', post_id=post.id))
		elif post_form.add_empty.data and post_form.validate():
			post_temp_cache.content += f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.update_post', post_id=post.id))
		elif post_form.submit.data and post_form.validate():
			post.title = post_temp_cache.title
			post.content = post_temp_cache.content

			if PostCache.query.filter_by(post_id=post.id, user_id=current_user.id).first():
				db.session.delete(post_temp_cache)

			db.session.commit()
			return redirect(url_for('posts.post', post_id=post.id))
		else:
			return redirect(url_for('posts.update_post', post_id=post.id))
