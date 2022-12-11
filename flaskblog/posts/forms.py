from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, HiddenField, SubmitField
from wtforms.validators import DataRequired


class PostForm(FlaskForm):
	title = StringField(validators=[DataRequired()])
	file = HiddenField()
	import_file = FileField(validators=[FileAllowed(['png', 'jpg', 'gif'])])
	add_empty = SubmitField()
	submit = SubmitField()


class CommentForm(FlaskForm):
	content = TextAreaField(validators=[DataRequired()])
	comment_id = HiddenField()
	submit = SubmitField()
