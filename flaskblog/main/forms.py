from flask_wtf import FlaskForm
from wtforms import SearchField
from wtforms.validators import DataRequired


class SearchForm(FlaskForm):
    searched = SearchField(validators=[DataRequired()])
