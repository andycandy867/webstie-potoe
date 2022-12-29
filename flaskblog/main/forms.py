from flask_wtf import FlaskForm
from wtforms import SearchField


class SearchForm(FlaskForm):
    search_field = SearchField()
