from datetime import datetime
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask import current_app
from flaskblog import db, login_manager
from flask_login import UserMixin


@login_manager.user_loader
def load_user(user_id):
	return User.query.get(user_id)


user_user_follow = db.Table(
	'user_user_follow',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
)

user_post_view = db.Table(
	'user_post_view',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
)

user_post_like = db.Table(
	'user_post_like',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
)

user_post_dislike = db.Table(
	'user_post_dislike',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
)

user_comment_like = db.Table(
	'user_comment_like',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('comment_id', db.Integer, db.ForeignKey('comment.id')),
)

user_comment_dislike = db.Table(
	'user_comment_dislike',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('comment_id', db.Integer, db.ForeignKey('comment.id')),
)

post_tag_cat = db.Table(
	'post_tag_cat',
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
	db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
)


class User(db.Model, UserMixin):
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(16), unique=True, nullable=False)
	email = db.Column(db.String(120), unique=True, nullable=False)
	image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
	password = db.Column(db.String(60), nullable=False)

	following = db.relationship('User', secondary=user_user_follow, backref='followers')
	media_uploads = db.relationship('Media', backref='uploader', lazy=True)

	posts_cached = db.relationship('PostCache', backref='cache_author', lazy=True)

	posts = db.relationship('Post', backref='author', lazy=True)
	posts_viewed = db.relationship('Post', secondary=user_post_view, backref='viewers')
	posts_liked = db.relationship('Post', secondary=user_post_like, backref='post_likers')
	posts_disliked = db.relationship('Post', secondary=user_post_dislike, backref='post_dislikers')

	comments = db.relationship('Comment', backref='author', lazy=True)
	comments_liked = db.relationship('Comment', secondary=user_comment_like, backref='comment_likers')
	comments_disliked = db.relationship('Comment', secondary=user_comment_dislike, backref='comment_dislikers')

	def get_reset_token(self):
		s = Serializer(current_app.config['SECRET_KEY'])
		return s.dumps({'user_id': self.id})

	@staticmethod
	def verify_reset_token(token, expires_sec=1800):
		s = Serializer(current_app.config['SECRET_KEY'])
		try:
			user_id = s.loads(token, expires_sec)['user_id']
		except:
			return None
		return User.query.get(user_id)

	def __repr__(self):
		return f"User('{self.username}', '{self.email}', '{self.image_file}')"


class Post(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	title = db.Column(db.String(100), nullable=False)
	date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	content = db.Column(db.Text, nullable=False)

	views = db.Column(db.Integer, nullable=False, default=0)
	comments = db.relationship('Comment', backref='parent', lazy=True)

	tags = db.relationship('Tag', secondary=post_tag_cat, backref='posts_tagged')

	def __repr__(self):
		return f"Post('{self.title}', '{self.date_posted}')"


class PostCache(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	date_cached = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	title = db.Column(db.String(100), default='', nullable=False)
	content = db.Column(db.Text, default='', nullable=False)


class Comment(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
	comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)
	date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	content = db.Column(db.Text, nullable=False)

	def __repr__(self):
		return f"Comment('{self.date_posted}')"


class Media(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	date_uploaded = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	file = db.Column(db.String(50), nullable=False)


class Tag(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(30), nullable=False)
	color = db.Column(db.String(7), default='#808080', nullable=False)
