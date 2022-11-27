import re
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, current_user
from flaskblog.config import Config
from urllib.parse import unquote as urllib_unquote

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
login_manager.login_view = 'users.signin'
login_manager.login_message_category = 'info'


def create_app(config_class=Config):
	app = Flask(__name__)
	app.config.from_object(config_class)

	db.init_app(app)
	bcrypt.init_app(app)
	login_manager.init_app(app)

	@app.template_filter('unquote')
	def unquote(url):
		safe = app.jinja_env.filters['safe']
		return safe(urllib_unquote(url))

	@app.template_global()
	def length(v):
		return len(v)

	@app.template_global()
	def comment_like_check(comment):
		comment_liked = 'undefined'
		if comment in current_user.comments_liked:
			comment_liked = 'True'
		elif comment in current_user.comments_disliked:
			comment_liked = False
		return comment_liked

	@app.template_global()
	def is_media(splinted):
		if '*/#|>' in splinted:
			return 'Yes'
		elif splinted == ':*EMPTY*:':
			return 'Empty'
		else:
			return False

	@app.template_global()
	def get_media_size(splinted):
		searched = re.search(r'(?<=\|:)(.*?)(?=\s*:\|)', splinted)
		return searched.group()

	@app.template_global()
	def rm_suffix(string):
		suffix_gone = string.removesuffix('*/#|>')
		return suffix_gone.split('|:')[0]

	from flaskblog.main.routes import main
	from flaskblog.users.routes import users
	from flaskblog.settings.routes import settings
	from flaskblog.posts.routes import posts
	from flaskblog.collections.routes import collections
	from flaskblog.errors.handlers import errors
	app.register_blueprint(main)
	app.register_blueprint(users)
	app.register_blueprint(settings)
	app.register_blueprint(posts)
	app.register_blueprint(collections)
	app.register_blueprint(errors)

	return app
