from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, HiddenField, SubmitField
from wtforms.validators import DataRequired


class PostForm(FlaskForm):
	title = StringField(validators=[DataRequired()])
	thumbnail_image = FileField(validators=[FileAllowed(['png', 'jpg'])])
	file = HiddenField()
	import_file = FileField(validators=[FileAllowed(['png', 'jpg', 'mp4'])])
	submit_insert = SubmitField()
	submit = SubmitField()


class CommentForm(FlaskForm):
	content = TextAreaField(validators=[DataRequired()])
	comment_id = HiddenField()
	submit = SubmitField()


class LikeForm(FlaskForm):
	like_submit = SubmitField()


class DislikeForm(FlaskForm):
	dislike_submit = SubmitField()


class FollowForm(FlaskForm):
	follow_submit = SubmitField()
