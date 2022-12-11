import re
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
	db.Column('follower_user_id', db.Integer, db.ForeignKey('user.id'), index=True),
	db.Column('following_user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('date_followed', db.DateTime, default=datetime.utcnow),
	db.Column('follower_number', db.Integer)
)

user_post_view = db.Table(
	'user_post_view',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
	db.Column('date_viewed', db.DateTime, default=datetime.utcnow)
)

user_post_like = db.Table(
	'user_post_like',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
	db.Column('date_liked', db.DateTime, default=datetime.utcnow)
)

user_post_dislike = db.Table(
	'user_post_dislike',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
	db.Column('date_disliked', db.DateTime, default=datetime.utcnow)
)

user_comment_like = db.Table(
	'user_comment_like',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('comment_id', db.Integer, db.ForeignKey('comment.id')),
	db.Column('date_liked', db.DateTime, default=datetime.utcnow)
)

user_comment_dislike = db.Table(
	'user_comment_dislike',
	db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
	db.Column('comment_id', db.Integer, db.ForeignKey('comment.id')),
	db.Column('date_disliked', db.DateTime, default=datetime.utcnow)
)

post_tag_cat = db.Table(
	'post_tag_cat',
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
	db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
)

post_collection = db.Table(
	'post_collection',
	db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
	db.Column('collection_id', db.Integer, db.ForeignKey('collection.id')),
)


class User(db.Model, UserMixin):
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(16), unique=True, nullable=False)
	email = db.Column(db.String(120), unique=True, nullable=False)
	image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
	banner_image = db.Column(db.String(20), nullable=False, default='default_banner.jpg')
	description = db.Column(db.String(120), nullable=True)
	password = db.Column(db.String(60), nullable=False)
	security_question = db.Column(db.String(120), nullable=True)
	security_question_answer = db.Column(db.String(120), nullable=True)
	date_joined = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

	following = db.relationship('User', secondary=user_user_follow,
								primaryjoin=id == user_user_follow.c.follower_user_id,
								secondaryjoin=id == user_user_follow.c.following_user_id,
								backref='followers')

	def follow(self, user):
		if user not in self.following:
			self.following.append(user)

	def unfollow(self, user):
		if user in self.following:
			self.following.remove(user)
	media_uploads = db.relationship('Media', backref='uploader', lazy=True)

	posts_cached = db.relationship('PostCache', backref='cache_author', lazy=True)

	posts = db.relationship('Post', backref='author', lazy=True)
	posts_viewed = db.relationship('Post', secondary=user_post_view, backref='viewers')
	posts_liked = db.relationship('Post', secondary=user_post_like, backref='post_likers')
	posts_disliked = db.relationship('Post', secondary=user_post_dislike, backref='post_dislikers')

	featured_post_id = db.Column(db.Integer, nullable=True)

	comments = db.relationship('Comment', backref='author', lazy=True)
	comments_liked = db.relationship('Comment', secondary=user_comment_like, backref='comment_likers')
	comments_disliked = db.relationship('Comment', secondary=user_comment_dislike, backref='comment_dislikers')

	collections = db.relationship('Collection', backref='author', lazy=True)

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


def get_duration(then):
	duration = datetime.utcnow() - then
	duration_in_s = duration.total_seconds()

	def years():
		return divmod(duration_in_s, 31536000)  # Seconds in a year=31536000.

	def months():
		return divmod(duration_in_s, 2628000)  # Seconds in a month = 2628000

	def weeks():
		return divmod(duration_in_s, 604800)  # Seconds in a week = 604800

	def days():
		return divmod(duration_in_s, 86400)  # Seconds in a day = 86400

	def hours():
		return divmod(duration_in_s, 3600)  # Seconds in an hour = 3600

	def minutes():
		return divmod(duration_in_s, 60)  # Seconds in a minute = 60

	time_difference = {
		'years': int(years()[0]),
		'months': int(months()[0]),
		'weeks': int(weeks()[0]),
		'days': int(days()[0]),
		'hours': int(hours()[0]),
		'minutes': int(minutes()[0]),
		'seconds': int(duration_in_s)
	}

	if time_difference['years'] > 0:
		final_time_difference = {'unit': 'year', 'amount': time_difference['years']}
	elif time_difference['months'] > 0:
		final_time_difference = {'unit': 'month', 'amount': time_difference['months']}
	elif time_difference['weeks'] > 0:
		final_time_difference = {'unit': 'week', 'amount': time_difference['weeks']}
	elif time_difference['days'] > 0:
		final_time_difference = {'unit': 'day', 'amount': time_difference['days']}
	elif time_difference['hours'] > 0:
		final_time_difference = {'unit': 'hour', 'amount': time_difference['hours']}
	elif time_difference['minutes'] > 0:
		final_time_difference = {'unit': 'minute', 'amount': time_difference['minutes']}
	else:
		final_time_difference = {'unit': 'second', 'amount': time_difference['seconds']}

	if final_time_difference['amount'] == 1:
		return f'{final_time_difference["amount"]} {final_time_difference["unit"]} ago'
	else:
		return f'{final_time_difference["amount"]} {final_time_difference["unit"]}s ago'


class Post(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	title = db.Column(db.String(100), nullable=False)
	date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	content = db.Column(db.Text, nullable=False)

	views = db.Column(db.Integer, nullable=False, default=0)
	likes = db.Column(db.Integer, nullable=False, default=0)
	comments = db.relationship('Comment', backref='parent', lazy=True)

	tags = db.relationship('Tag', secondary=post_tag_cat, backref='posts_tagged')

	def __repr__(self):
		return f"Post('{self.title}', '{self.date_posted}')"

	def date_posted_ago(self):
		date_posted = getattr(self, 'date_posted')
		return get_duration(date_posted)

	def as_dict(self):
		dictionary = {}
		for c in self.__table__.columns:
			if c.name not in ['user_id', 'content', 'comments', 'tags', 'date_posted']:
				dictionary[c.name] = getattr(self, c.name)
			elif c.name == 'user_id':
				user = User.query.get(getattr(self, c.name))
				dictionary['author'] = user.username
				dictionary['image_file'] = user.image_file
				dictionary['followers_count'] = len(user.followers)
			elif c.name == 'date_posted':
				date_posted = getattr(self, c.name)

				dictionary['date_posted'] = get_duration(date_posted)
			elif c.name == 'content':
				splinted = re.split('{{|}}', getattr(self, c.name))

				for i, splint in enumerate(splinted):
					if splint == '':
						splinted.pop(i)
					elif '*/#|>' in splint:
						splinted.pop(i)

				if len(splinted[0].split()) > 17:
					dictionary['content'] = splinted[0].split('\n')[0]
				else:
					dictionary['content'] = splinted[0] + '	...'

		return dictionary


class PostCache(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=True)
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

	def date_posted_ago(self):
		date_posted = getattr(self, 'date_posted')
		return get_duration(date_posted)

	def as_dict(self):
		dictionary = {}
		for c in self.__table__.columns:
			if c.name not in ['user_id', 'date_posted']:
				dictionary[c.name] = getattr(self, c.name)
			elif c.name == 'user_id':
				user = User.query.get(getattr(self, c.name))
				dictionary['author'] = user.username
				dictionary['image_file'] = user.image_file
			elif c.name == 'date_posted':
				dictionary['date_posted'] = getattr(self, c.name).strftime('%x')

		return dictionary

	def __repr__(self):
		return f"Comment('{self.date_posted}')"


class Media(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	date_uploaded = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	file = db.Column(db.String(50), nullable=False)


class Collection(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	type = db.Column(db.String(10), nullable=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
	name = db.Column(db.String(30), nullable=False)
	image_file = db.Column(db.String(20), nullable=False, default='default_banner.jpg')
	date_created = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
	date_updated = db.Column(db.DateTime, nullable=True)
	posts = db.relationship('Post', secondary=post_collection, backref='parent_collection')

	def date_updated_ago(self):
		date_updated = getattr(self, "date_updated")

		if date_updated:
			return get_duration(date_updated)


class Tag(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(30), nullable=False)
	color = db.Column(db.String(7), default='#808080', nullable=False)
