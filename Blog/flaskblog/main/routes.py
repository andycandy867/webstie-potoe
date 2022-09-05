import re
from flask import render_template, request, Blueprint, url_for, redirect
from flask_login import current_user
from flaskblog.models import Post, User
from flaskblog.main.forms import SearchForm

main = Blueprint('main', __name__)


# Gives variables to the base template/ all templates
@main.app_context_processor
def inject_template_globals():
	if current_user.is_authenticated:
		image_file_2 = current_user.image_file
	else:
		image_file_2 = 'default.jpg'
	return dict(image_file=url_for('static', filename=f'images/profile_pics/{image_file_2}'), SearchForm=SearchForm())


@main.route('/', methods=['GET', 'POST'])
def home():
	page = request.args.get('page', 1, type=int)
	starting_posts = Post.query.order_by(Post.date_posted.desc())

	limit_content = {}
	for post in starting_posts:
		splinted = re.split('{{|}}', post.content)

		for i, splint in enumerate(splinted):
			if splint == '':
				splinted.pop(i)
			elif '*/#|>' in splint:
				splinted.pop(i)

		if len(splinted[0].split()) > 17:
			limit_content[post.id] = splinted[0].split('\n')[0]
		else:
			limit_content[post.id] = splinted[0] + ' ...'

	posts = Post.query.order_by(Post.date_posted.desc()).paginate(page=page, per_page=5)  # Get random or recommended
	return render_template('home.html', posts=posts, limit_content=limit_content)


@main.route('/results', methods=['GET', 'POST'])
def search():
	form = SearchForm()

	if form.validate_on_submit():
		return redirect(url_for('main.search', search_query=form.searched.data))

	searched_for = request.args.get('search_query', type=str)
	if searched_for:
		title_post_query = Post.query.filter(Post.title.like('%' + searched_for + '%'))
		content_post_query = Post.query.filter(Post.content.like('%' + searched_for + '%'))
		user_query = User.query.filter(User.username.like('%' + searched_for + '%'))

		display_user = user_query.first()
		for user in user_query:
			if user.followers > display_user.followers:
				display_user = user

		posts = title_post_query.order_by(Post.title).all() + content_post_query.order_by(Post.title).all()
		limit_content = {}
		for post in posts:
			if len(post.content.split()) > 17:
				limit_content[post.id] = post.content.split('\n')[0]
			else:
				limit_content[post.id] = post.content
		return render_template('results.html', form=form, searched=searched_for, limit_content=limit_content, posts=posts,
							   user=display_user)

	return redirect(url_for('main.home'))


@main.route('/explore')
def explore():
	explore_option = request.args.get('c')

	if explore_option == 'trending':
		return render_template('/explore/trending.html', title='Trending')
	elif explore_option == 'most-viewed':
		return render_template('/explore/most_viewed.html', title='Most Viewed')
	elif explore_option == 'most-liked':
		return render_template('/explore/most_liked.html', title='Most Liked')
	elif explore_option == 'seek3wl':
		return render_template('/explore/seek3wl.html', title='Seek3wl')
	elif explore_option == 'osu-mania':
		return render_template('/explore/osu_mania.html', title='Osu Mania')
	elif explore_option == 'programs':
		return render_template('/explore/programs.html', title='Programs')
	elif explore_option == 'guides':
		return render_template('/explore/guides.html', title='Guides')
	elif explore_option == 'logs':
		return render_template('/explore/logs.html', title='Logs')
	else:
		featured_posts = Post.query.order_by(Post.views.desc())[0:3]
		trending_posts = Post.query.order_by(Post.views.desc())[0:30]

		limit_content = {}
		for post in featured_posts + trending_posts:
			if len(post.content.split()) > 17:
				limit_content[post.id] = post.content.split('\n')[0]
			else:
				limit_content[post.id] = post.content

		return render_template('/explore/explore.html', title='Explore', featured_posts=featured_posts,
							   limit_content=limit_content, trending_posts=trending_posts)


@main.route('/about')
def about():
	return render_template('about.html', title='About')
