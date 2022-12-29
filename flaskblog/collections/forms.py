from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired


class RenameCollectionForm(FlaskForm):
	name = StringField(validators=[DataRequired()])
	submit = SubmitField()


class UpdateCollectionImageForm(FlaskForm):
	import_image_file = FileField(validators=[FileAllowed(['png', 'jpg', 'gif'])])
	submit = SubmitField()
