from django.contrib.auth.models import PermissionsMixin, AbstractBaseUser, BaseUserManager
from django.core.mail import send_mail
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import JSONField
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class MyUserManager(BaseUserManager):
    """
    A custom user manager to deal with emails as unique identifiers for auth
    instead of usernames. The default that's used is "UserManager"
    """

    def create_user(self, email, password=None, google_user=False, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, is_google_user=google_user, **extra_fields)
        if not google_user:
            user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    An abstract base class implementing a fully featured User model with
    admin-compliant permissions.
    email and password are required. Other fields are optional.
    """

    id = models.AutoField(primary_key=True)
    first_name = models.CharField(_('first name'), max_length=45, blank=True)
    middle_name = models.CharField(_('last name'), max_length=45, blank=True)
    last_name = models.CharField(_('last name'), max_length=45, blank=True)
    email = models.EmailField(_('email address'), unique=True, blank=True,
                              error_messages={'unique': _("A user with that email already exists.")})
    is_staff = models.BooleanField(_('staff status'), default=False,
                                   help_text=_('Designates whether the user can log into this admin site.'), )
    is_active = models.BooleanField(_('active'), default=False,
                                    help_text=_(
                                        'Designates whether this user should be treated as active. '
                                        'Unselect this instead of deleting accounts.'
                                    ))
    is_email_verified = models.BooleanField(_('email_verified'), default=False)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    is_google_user = models.BooleanField(_('google user'), default=False)

    objects = MyUserManager()

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        abstract = False
        db_table = 'user'

    def clean(self):
        super().clean()
        self.email = self.__class__.objects.normalize_email(self.email)

    def get_full_name(self):
        """
        Return the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Send an email to this user."""
        send_mail(subject, message, from_email, [self.email], **kwargs)


### Model Validators ###

trackerValidator = RegexValidator(r'^[0-9a-zA-Z_\-# &()]*$',
                                  message='Only alphanumerics and " _-#&()" are allowed.', code='invalid_name')


# Start of self manage db tables, that isn't generated through django mapping


class YoutubeDataApiKey(models.Model):
    youtube_data_api_key_id = models.IntegerField(primary_key=True)
    user = models.ForeignKey(User, models.DO_NOTHING)
    youtube_data_api_key_value = models.CharField(max_length=80)
    use_order = models.IntegerField(default=0)

    class Meta:
        managed = False
        db_table = 'youtube_data_api_key'
        unique_together = (('user', 'youtube_data_api_key_value'),)


class ChannelManager(models.Manager):

    def get_queryset(self):
        return super(ChannelManager, self).get_queryset().prefetch_related(
            models.Prefetch('channelsdaily_set', queryset=ChannelsDaily.objects.order_by('-channels_daily_id')))


class Channels(models.Model):
    channel_id = models.CharField(primary_key=True, max_length=64)
    channel_title = models.CharField(max_length=100)
    thumbnails_medium_url = models.CharField(max_length=144, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    joined_date = models.DateTimeField(blank=True, null=True)
    added_to_db_time = models.DateTimeField(auto_now=True)
    location = models.CharField(max_length=45, blank=True, null=True)
    language = models.CharField(max_length=45, blank=True, null=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)
    objects = ChannelManager()

    @property
    def latest_DailyId(self):
        channel_daily_ids = self.channelsdaily_set.all()
        if len(channel_daily_ids) > 0:
            return channel_daily_ids[0]
        return None

    class Meta:
        managed = False
        db_table = 'channels'
        ordering = ['-added_to_db_time']


class ChannelsDaily(models.Model):
    channels_daily_id = models.BigAutoField(primary_key=True)
    # channel_id = models.CharField(max_length=100)  ##set to foreign key once gathering is set up
    channel_id = models.ForeignKey(Channels, models.DO_NOTHING,
                                   db_column='channel_id')  # set to foreign key once gathering is set up
    total_views = models.BigIntegerField(blank=True, null=True)
    total_subscribers = models.BigIntegerField(blank=True, null=True)
    total_videos = models.BigIntegerField(blank=True, null=True)
    extracted_date = models.DateTimeField()
    actual_extracted_time = models.DateTimeField()
    channels_daily_views = models.BigIntegerField(blank=True, null=True)
    channels_daily_subscribers = models.BigIntegerField(blank=True, null=True)
    channels_daily_videos = models.BigIntegerField(blank=True, null=True)
    added_to_db_time = models.DateTimeField(auto_now_add=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'channels_daily'
        unique_together = (('channel_id', 'extracted_date'),)
        ordering = ['-extracted_date']


class VideoManager(models.Manager):

    def get_queryset(self):
        return super(VideoManager, self).get_queryset().prefetch_related(
            models.Prefetch('videosdaily_set', queryset=VideosDaily.objects.order_by('-videos_daily_id')))


class Videos(models.Model):
    video_id = models.CharField(primary_key=True, max_length=16)
    video_title = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, null=True)
    published_date = models.DateTimeField()
    thumbnails_medium_url = models.CharField(max_length=64, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    channel = models.ForeignKey(Channels, models.DO_NOTHING)
    added_to_db_time = models.DateTimeField(auto_now=True)
    # source_id = models.ForeignKey('YTAdminConsole.YtCrawlerPipeline', models.DO_NOTHING, db_column='source_id')
    source_id = models.ForeignKey('YTAdminConsole.YtCrawlerPipeline', on_delete=models.CASCADE, db_column='source_id')
    modified_to_db_time = models.DateTimeField(auto_now=True)
    content_top_emotion = models.CharField(max_length=12)
    content_top_score = models.FloatField()
    content_emotions = JSONField()
    comments_top_emotion = models.CharField(max_length=12)
    comments_top_score = models.FloatField()
    comments_emotions = JSONField()
    movie_barcode = JSONField(blank=True, null=True)
    transcript = models.TextField(blank=True, null=True)
    objects = VideoManager()

    @property
    def latest_DailyId(self):
        video_daily_ids = self.videosdaily_set.all()
        if len(video_daily_ids) > 0:
            return video_daily_ids[0]
        return None

    class Meta:
        managed = False
        db_table = 'videos'
        ordering = ['-added_to_db_time']


class VideosDaily(models.Model):
    videos_daily_id = models.BigAutoField(primary_key=True)
    # video_id = models.CharField(max_length=16)  # set to foreign key once data is setup
    video_id = models.ForeignKey(Videos, models.DO_NOTHING,
                                 db_column='video_id')  # set to foreign key once data is setup
    total_views = models.BigIntegerField()
    total_likes = models.BigIntegerField()
    total_dislikes = models.BigIntegerField()
    total_comments = models.BigIntegerField(blank=True, null=True)  # set to not null once data is set up
    extracted_date = models.DateTimeField()
    actual_extracted_time = models.DateTimeField()
    videos_daily_views = models.BigIntegerField(blank=True, null=True)
    videos_daily_likes = models.BigIntegerField(blank=True, null=True)
    videos_daily_dislikes = models.BigIntegerField(blank=True, null=True)
    videos_daily_comments = models.BigIntegerField(blank=True, null=True)
    added_to_db_time = models.DateTimeField(auto_now_add=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'videos_daily'
        unique_together = (('video_id', 'extracted_date'),)
        ordering = ['-extracted_date']


class Tracker(models.Model):
    tracker_id = models.AutoField(primary_key=True)
    tracker_name = models.CharField(max_length=64, validators=[trackerValidator])
    tracker_creater = models.ForeignKey('User', models.DO_NOTHING, db_column='tracker_creater')
    tracker_description = models.CharField(max_length=255, blank=True, null=True)
    is_public = models.BooleanField(default=False)
    created_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'tracker'
        unique_together = (('tracker_name', 'tracker_creater'),)


class Keyword(models.Model):
    keyword = models.CharField(primary_key=True, max_length=128)
    created_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'keyword'


class TrackerRelationship(models.Model):
    tracker_relationship_id = models.AutoField(primary_key=True)
    tracker = models.ForeignKey(Tracker, models.DO_NOTHING, db_column='tracker')
    content_type = models.CharField(max_length=16)
    content_id = models.CharField(max_length=64)
    keyword = models.ForeignKey(Keyword, models.DO_NOTHING, db_column='keyword', blank=True, null=True)
    created_time = models.DateTimeField(auto_now=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'tracker_relationship'
        unique_together = (('tracker', 'content_type', 'content_id', 'keyword'),)


class SMLink(models.Model):
    id = models.BigAutoField(primary_key=True)
    channel_id = models.CharField(max_length=45, blank=True, null=True)
    smlink = models.CharField(max_length=255, blank=True, null=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    extracted_date = models.DateTimeField(blank=True, null=True)
    added_to_db_time = models.DateTimeField(auto_now_add=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'smlinks'


class Comments(models.Model):
    comment_id = models.CharField(primary_key=True, max_length=255)
    commenter_name = models.CharField(max_length=255, blank=True, null=True)
    commenter_id = models.CharField(max_length=255, blank=True, null=True)
    comment_displayed = models.TextField(blank=True, null=True)
    comment_original = models.TextField(blank=True, null=True)
    likes = models.CharField(max_length=255, blank=True, null=True)
    total_replies = models.CharField(max_length=255, blank=True, null=True)
    published_date = models.CharField(max_length=255, blank=True, null=True)
    updated_date = models.CharField(max_length=255, blank=True, null=True)
    reply_to = models.CharField(max_length=45, blank=True, null=True)
    video = models.ForeignKey(Videos, models.DO_NOTHING, db_column='video_id', blank=True, null=True)
    sentiment = models.IntegerField(blank=True, null=True)
    added_to_db_time = models.DateTimeField(auto_now_add=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'comments'


class RelatedVideos(models.Model):
    video_id = models.CharField(max_length=16, primary_key=True)
    parent_video = models.CharField(max_length=16)
    title = models.CharField(max_length=255, blank=True, null=True)
    thumbnails_medium_url = models.CharField(max_length=64, blank=True, null=True)
    published_date = models.DateTimeField(blank=True, null=True)
    channel_id = models.CharField(max_length=64)
    channel_title = models.CharField(max_length=255, null=True)
    added_to_db_time = models.DateTimeField(auto_now=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'related_videos'
        unique_together = (('video_id', 'parent_video'),)


class TrackerContentAnalysis(models.Model):
    tracker_id = models.CharField(primary_key=True, max_length=255)
    tracker_top_terms = JSONField(blank=True, null=True)
    top_term = models.CharField(max_length=255)
    sentiment = models.CharField(max_length=255)
    language = models.CharField(max_length=255)
    added_to_db_time = models.DateTimeField(auto_now=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'tracker_content_analysis'


class VideoContentAnalysis(models.Model):
    video_id = models.CharField(primary_key=True, max_length=255)
    video_top_terms = JSONField(blank=True, null=True)
    top_term = models.CharField(max_length=255)
    desc_lang = models.CharField(max_length=255)
    added_to_db_time = models.DateTimeField(auto_now=True)
    modified_to_db_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'video_content_analysis'
