from datetime import datetime
from sqlalchemy.sql.expression import func
from flask import render_template, request, Blueprint, url_for, redirect, make_response, jsonify
from flask_login import current_user, login_required
from flaskblog.models import Post, User, PostCache, Collection, user_post_like
from flaskblog.main.forms import SearchForm
from flaskblog.main.utils import limit_content_posts


main = Blueprint('main', __name__)


# Gives variables to the base template/all templates
@main.app_context_processor
def inject_template_globals():
	if current_user.is_authenticated:
		image_file_2 = current_user.image_file
	else:
		image_file_2 = 'default.jpg'

	has_post_cache = False
	if current_user.is_authenticated:
		if PostCache.query.filter_by(user_id=current_user.id):
			has_post_cache = True

	return dict(image_file=url_for('static', filename=f'images/profile_pics/{image_file_2}'),
				search_form=SearchForm(), has_post_cache=has_post_cache)


home_quantity = 7
home_recommended = []


@main.route('/')
def home():
	starting_posts = Post.query.order_by(Post.date_posted.desc()).limit(50).all()

	global home_recommended
	home_recommended = []
	for post in starting_posts:
		home_recommended.append(post.as_dict())

	return render_template('home.html')


@main.route('/load_home')
def load_home():
	if request.args:
		counter = int(request.args.get('c'))
		if counter == 0:
			res = make_response(jsonify(home_recommended[0: home_quantity]), 200)
		elif counter > len(home_recommended) + home_quantity:
			res = make_response(jsonify({}), 200)
		else:
			res = make_response(jsonify(home_recommended[home_quantity: home_quantity + counter]), 200)

	return res


@main.route('/results', methods=['GET', 'POST'])
def search():
	form = SearchForm()

	if form.validate_on_submit():
		return redirect(url_for('main.search', search_query=form.search_field.data))

	searched_for = request.args.get('search_query', type=str)
	date_filter = request.args.get("date_filter", type=str)
	type_filter = request.args.get("type_filter", type=str)
	tags = request.args.get("tags", type=list)
	sort = request.args.get("sort", type=str)

	filters = {"date_filter": date_filter, "type_filter": type_filter, "tags": tags, "sort": sort}

	if searched_for:
		title_post_query = Post.query.filter(Post.title.like('%' + searched_for + '%'))
		content_post_query = Post.query.filter(Post.content.like('%' + searched_for + '%'))
		posts = title_post_query.union(content_post_query)

		if date_filter:
			if date_filter == "Today":
				from_date = datetime(year=datetime.utcnow().year, month=datetime.utcnow().month,
									 day=datetime.utcnow().day - 1)
			elif date_filter == "This Week":
				from_date = datetime(year=datetime.utcnow().year, month=datetime.utcnow().month,
									 day=datetime.utcnow().day - 7)
			elif date_filter == "This Month":
				from_date = datetime(year=datetime.utcnow().year, month=datetime.utcnow().month - 1,
									 day=datetime.utcnow().day)
			elif date_filter == "This Year":
				from_date = datetime(year=datetime.utcnow().year - 1, month=datetime.utcnow().month,
									 day=datetime.utcnow().day)

			if from_date:
				posts = posts.filter(Post.date_posted >= from_date)

		if type_filter:
			if type_filter == "Post":
				pass
			elif type_filter == "Collection":
				pass
			elif type_filter == "User":
				pass
		else:
			# Default (First User and Posts)
			pass

		if tags:
			pass

		if sort:
			if sort == "Most Recent":
				posts = posts.order_by(Post.date_posted.desc())
			elif sort == "Most Viewed":
				posts = posts.order_by(Post.views.desc())
			elif sort == "Most Liked":
				posts = posts.order_by(Post.likes.desc())

		user_query = User.query.filter(User.username.like('%' + searched_for + '%'))

		display_user = user_query.first()
		display_user_posts = []

		if display_user:
			for user in user_query.all():
				if user.followers > display_user.followers:
					display_user = user

			display_user_posts = Post.query.filter_by(user_id=display_user.id).order_by(Post.views.desc()).limit(
				3).all()

		limit_content = limit_content_posts(posts.all() + display_user_posts)

		return render_template('results.html', form=form, searched=searched_for, posts=posts,
							   limit_content=limit_content, user=display_user, display_user_posts=display_user_posts,
							   filters=filters)

	return redirect(url_for('main.home'))


@main.route('/explore')
def explore():
	explore_option = request.args.get('c')

	if explore_option == 'trending':
		trending_posts = Post.query.order_by(Post.views.desc()).limit(50).all()

		limit_content = limit_content_posts(trending_posts)
		return render_template('/explore/trending.html', title='Trending', trending_posts=trending_posts,
							   limit_content=limit_content)
	elif explore_option == 'most-viewed':
		most_viewed_posts = Post.query.order_by(Post.views.desc()).limit(50).all()

		limit_content = limit_content_posts(most_viewed_posts)
		return render_template('/explore/most_viewed.html', title='Most Viewed',
							   most_viewed_posts=most_viewed_posts, limit_content=limit_content)
	elif explore_option == 'most-liked':
		# Route Doesn't Work, as likes are currently in a Db.Table instead of a column
		most_liked_posts = Post.query.order_by(Post.likes.desc()).limit(50).all()

		limit_content = limit_content_posts(most_liked_posts)
		return render_template('/explore/most_liked.html', title='Most Liked', most_liked_posts=most_liked_posts,
							   limit_content=limit_content)
	elif explore_option == 'seek3wl':
		seek3wl = User.query.filter_by(username='seek3wl').first()
		seek3wl_posts = Post.query.filter_by(user_id=seek3wl.id).order_by(Post.date_posted.desc()).all()

		limit_content = limit_content_posts(seek3wl_posts)
		return render_template('/explore/seek3wl.html', title='Seek3wl', seek3wl_posts=seek3wl_posts,
							   limit_content=limit_content)
	elif explore_option == 'osu-mania':
		return render_template('/explore/osu_mania.html', title='Osu Mania')
	else:
		featured_posts = Post.query.order_by(Post.views.desc()).limit(3).all()
		trending_posts = Post.query.order_by(Post.views.desc()).limit(30).all()

		limit_content = limit_content_posts(featured_posts + trending_posts)
		return render_template('/explore/explore.html', title='Explore', featured_posts=featured_posts,
							   trending_posts=trending_posts, limit_content=limit_content)


@main.route('/random')
def random():
	post = Post.query.order_by(func.random()).first()
	return redirect(url_for('posts.post', post_id=post.id))


@main.route('/following')
def following():
	if current_user.is_authenticated:
		followed_users = current_user.following

		followed_users_posts_count = {}
		for user in current_user.following:
			followed_users_posts_count[user.id] = len(Post.query.filter_by(user_id=user.id).all())

		followed_users_posts = []
		for user in current_user.following:
			followed_users_posts += Post.query.filter_by(user_id=user.id).all()

		limit_content = limit_content_posts(followed_users_posts)
		return render_template('following.html', title='Followed', followed_users=followed_users,
							   followed_users_posts=followed_users_posts,
							   followed_users_posts_count=followed_users_posts_count,
							   limit_content=limit_content)
	else:
		return render_template("/sign_in_prompts/following.html")


@main.route('/library')
def library():
	if current_user.is_authenticated:
		created_collections = Collection.query.filter_by(user_id=current_user.id).order_by(Collection.date_updated.desc())

		historical_posts = current_user.posts_viewed
		historical_posts_count = len(historical_posts) - 3
		historical_posts.reverse()
		historical_posts = historical_posts[:3]

		historical_posts_limit_content = limit_content_posts(historical_posts)

		liked_posts = current_user.posts_liked
		liked_posts_count = len(liked_posts) - 3
		liked_posts.reverse()
		liked_posts = liked_posts[:3]

		liked_posts_limit_content = limit_content_posts(liked_posts)

		created_posts = Post.query.filter_by(user_id=current_user.id).order_by(Post.date_posted.desc()).all()
		created_posts_count = len(created_posts) - 3
		created_posts = created_posts[:3]

		created_posts_limit_content = limit_content_posts(created_posts)
		return render_template('library.html', title='Library', created_collections=created_collections,
							   historical_posts=historical_posts,
							   historical_posts_limit_content=historical_posts_limit_content,
							   historical_posts_count=historical_posts_count, liked_posts=liked_posts,
							   liked_posts_limit_content=liked_posts_limit_content,
							   liked_posts_count=liked_posts_count, created_posts=created_posts,
							   created_posts_limit_content=created_posts_limit_content,
							   created_posts_count=created_posts_count)
	else:
		return render_template("/sign_in_prompts/library.html")


history_quantity = 7
history_recommended = []


@main.route('/history')
def history():
	if current_user.is_authenticated:
		history_posts = current_user.posts_viewed
		history_posts.reverse()

		global history_recommended
		history_recommended = []
		for post in history_posts:
			history_recommended.append(post.as_dict())

		return render_template('history.html', title='History')
	else:
		return render_template("sign_in_prompts/history.html")


@main.route('/load_history')
@login_required
def load_history():
	if request.args:
		counter = int(request.args.get('c'))
		if counter == 0:
			res = make_response(jsonify(history_recommended[0: history_quantity]), 200)
		elif counter > len(history_recommended) + history_quantity:
			res = make_response(jsonify({}), 200)
		else:
			res = make_response(jsonify(history_recommended[history_quantity: history_quantity + counter]), 200)

	return res


liked_quantity = 7
liked_recommended = []


@main.route('/liked')
def liked():
	if current_user.is_authenticated:
		liked_posts = current_user.posts_liked
		liked_posts.reverse()

		global liked_recommended
		liked_recommended = []
		for post in liked_posts:
			liked_recommended.append(post.as_dict())

		return render_template('liked.html', title='Liked')
	else:
		return render_template("sign_in_prompts/liked.html")


@main.route('/load_liked')
@login_required
def load_liked():
	if request.args:
		counter = int(request.args.get('c'))
		if counter == 0:
			res = make_response(jsonify(liked_recommended[0: liked_quantity]), 200)
		elif counter > len(liked_recommended) + liked_quantity:
			res = make_response(jsonify({}), 200)
		else:
			res = make_response(jsonify(liked_recommended[liked_quantity: liked_quantity + counter]), 200)

	return res


@main.route('/about')
def about():
	return render_template('about.html', title='About')


@main.route('/health_game')
def health_game():
	return render_template('health_game.html')
