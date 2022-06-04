from django import forms

class AddContentForm(forms.Form):
	content_list = forms.CharField(required=False, widget=forms.Textarea(
		attrs={'id': 'id_content_list', 'class': 'form-control', 'placeholder': "Enter Video/Channel IDs", 'rows': '8'}))
	keyword_list = forms.CharField(required=False, widget=forms.Textarea(
		attrs={'id': 'id_keyword_list', 'class': 'form-control', 'placeholder': "Enter keywords", 'rows': '8'}))
	run_name = forms.CharField(max_length=100, widget=forms.TextInput(
		attrs={'id': 'task_name', 'class': 'form-control', 'placeholder': "Enter name", 'required': ''}))
	slack_name = forms.CharField(required=False, max_length=120, widget=forms.TextInput(
		attrs={'id': 'user_slack_name', 'class': 'form-control', 'placeholder': "Enter Slack name"}))
	# Video Crawler Options
	daily_content_list = forms.CharField(required=False, widget=forms.Textarea(
		attrs={'id': 'id_daily_content_list', 'class': 'form-control', 'placeholder': "Enter Video IDs", 'rows': '8'}))
	get_videos = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'get_videos', 'class': 'form-control', 'checked': ''}))
	get_videos_stats = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'get_videos_stats', 'class': 'form-control'}))
	get_channels = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'get_channels', 'class': 'form-control', 'checked': ''}))
	get_channels_stats = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'get_channels_stats', 'class': 'form-control'}))
	get_related_videos = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'get_related_videos', 'class': 'form-control'}))
	get_comments = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'get_comments', 'class': 'form-control'}))
	channels_by_keyword = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'channels_by_keyword', 'class': 'form-control'}))
	parallel_process = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'parallel_process', 'class': 'form-control', 'checked': ''}))
	# Blog Crawler Options
	use_diffbot = forms.BooleanField(required=False, widget=forms.CheckboxInput (
		attrs={'id': 'use_diffbot', 'class': 'form-control'}))

class login_Form(forms.Form):
	email = forms.CharField(widget=forms.TextInput({'class' : 'form-control mb-1',
                                    'placeholder': 'Email', 'type': 'email'}), max_length=254)
	password= forms.CharField(widget=forms.PasswordInput(attrs={'class' : 'form-control',
                                   'placeholder': 'Password', 'data-type': 'password', 'type': 'password'}),max_length=128)