import re
from flask import render_template, url_for, flash, redirect, request, abort, Blueprint, make_response, jsonify
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import Post, Collection
from flaskblog.collections.forms import PostForm, CommentForm


collections = Blueprint('collections', __name__)


@collections.route('/collection', methods=["GET", "POST"])
def collection():
	collection_id = request.args.get('list')

	if request.method == "GET":
		if collection_id:
			if collection_id == 'RL':
				collection = Collection.query.filter_by(user_id=current_user.id, type='RL').first()
			elif collection_id == 'archived':
				collection = Collection.query.filter_by(user_id=current_user.id, type='archived').first()
			else:
				collection = Collection.query.get_or_404(collection_id)

				if collection.type:
					if collection.type == 'RL':
						return redirect(url_for('collections.collection', list='RL'))
					elif collection.type == 'archived':
						return redirect(url_for('collections.collection', list='archived'))

			limit_content = {}
			for post in collection.posts:
				splinted = re.split('{{|}}', post.content)

				for i, splint in enumerate(splinted):
					if splint == '':
						splinted.pop(i)
					elif '*/#|>' in splint:
						splinted.pop(i)

				if len(splinted[0].split()) > 17:
					limit_content[post.id] = splinted[0].split('\n')[0]
				else:
					limit_content[post.id] = splinted[0] + '...'

			return render_template('collection.html', title=collection.name, collection=collection,
								   collection_id=collection_id, limit_content=limit_content)
		else:
			return redirect(url_for('main.home'))
	elif request.method == "POST":
		collection = Collection.query.get_or_404(collection_id)

		if current_user.id == collection.user_id and not collection.type:
			db.session.delete(collection)
			db.session.commit()
			flash(f'Collection "{collection.name}" has successfully been deleted', "success")
			return redirect(url_for("main.home"))
		else:
			return redirect(url_for("collections.collection", list=collection.id))
