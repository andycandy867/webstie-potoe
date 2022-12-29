from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, PasswordField, BooleanField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from flaskblog.models import User


class RegistrationForm(FlaskForm):
	username = StringField(validators=[DataRequired(), Length(min=3, max=16)])
	email = StringField(validators=[DataRequired(), Email()])
	password = PasswordField(validators=[DataRequired()])
	confirm_password = PasswordField(validators=[DataRequired(), EqualTo('password')])
	submit = SubmitField()

	@staticmethod
	def validate_username(self, username):
		user = User.query.filter_by(username=username.data).first()
		if user:
			raise ValidationError(f'The username "{username.data}" is already taken. Please choose a different username')

	@staticmethod
	def validate_email(self, email):
		user = User.query.filter_by(email=email.data).first()
		if user:
			raise ValidationError(f'A user with the email "{email.data}" already exists.')


class SignInForm(FlaskForm):
	email = StringField(validators=[DataRequired(), Email()])
	password = PasswordField(validators=[DataRequired()])
	remember = BooleanField()
	submit = SubmitField()


class RequestResetForm(FlaskForm):
	email = StringField('Email', validators=[DataRequired(), Email()])
	question = SelectField('Security Question', choices=['What state were you born in?', 'What is the name of your favorite pet?'], validators=[DataRequired()])
	answer = StringField('Answer', validators=[DataRequired()])
	submit = SubmitField('Submit')


class UpdateBannerImageForm(FlaskForm):
	image_file = FileField(validators=[FileAllowed(['png', 'jpg', 'gif'])])
	submit = SubmitField()


class UpdateDescriptionForm(FlaskForm):
	description = TextAreaField('Description', validators=[DataRequired()])
	submit = SubmitField('Submit')
