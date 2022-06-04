from django.db.models import JSONField
from django.core.mail import send_mail
from django.db import models
from django.utils.translation import gettext_lazy as _
from youtube_tracker.models import Videos, Tracker

class YtCrawlerPipeline(models.Model):
	class Meta:
		db_table = 'yt_crawler_pipeline'
	# Default values
	DEFAULT_STATUS = 'not_crawled'
	PRIORITY_CHOICES = (
		('Low', 'Low'),
		('Medium', 'Medium'),
		('High', 'High'),
		('Critical', 'Critical')
	)
	# Fields
	source_id = models.BigAutoField(primary_key=True)
	content_id = models.CharField(max_length=255)
	priority = models.CharField(max_length=255, choices=PRIORITY_CHOICES, default='Low')
	status = models.CharField(max_length=255, default=DEFAULT_STATUS)
	content_type = models.CharField(max_length=255)
	tracker_id = models.ForeignKey(Tracker, models.DO_NOTHING, db_column="project_id", blank=True, null=True)
	user_id = models.IntegerField(blank=True, null=True)
	api_key = models.CharField(max_length=255, blank=True, null=True)
	added_to_db_time = models.DateTimeField(auto_now=True)

class CrawlerTask(models.Model):
	class Meta:
		db_table = 'tasks'
	# Fields
	task_id = models.BigAutoField(primary_key=True)
	task_name = models.CharField(max_length=45, unique=True)
	channels = JSONField(blank=True, null=True)
	videos = JSONField(blank=True, null=True)
	videos_daily = JSONField(blank=True, null=True)
	keywords = JSONField(blank=True, null=True)
	get_related_videos = models.SmallIntegerField(default=0)
	get_comments = models.SmallIntegerField(default=0)
	channels_by_keyword = models.SmallIntegerField(default=0)
	created_time = models.DateTimeField(auto_now=True)
	crawled_time = models.DateTimeField(blank=True, null=True)

class Keywords(models.Model):
	# Fields
	id = models.AutoField(primary_key=True,  db_column='id')
	keyword = models.CharField(max_length=100)
	video_id =models.ForeignKey(Videos, models.DO_NOTHING, db_column="video_id", default=None)
	class Meta:
		db_table = 'keywords'
		managed = False