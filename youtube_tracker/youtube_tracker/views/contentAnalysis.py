"""
Render, utilities, and REST API functions for the Content Analysis page.

"""

# General imports
from babel import Locale
import json
import logging

# Django imports
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.core.paginator import Paginator

# Elastic Search imports
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q as ES_Q
from django.conf import settings

# Sub packages
from ..models import TrackerContentAnalysis, Videos, VideoContentAnalysis
from .genericUtilities import convertToDate, dictionaryMerge, getMaxDictKey, parseRequest
from .queryUtils import getDateRangeCommentsRequest, getDateRangeVideoRequest, \
    getTrackerVideoIDs, getTrackerDetails, getVideos, buildElasticSearchResponse, getPageData, getElasticSearchClient
from .wrappers import ajax_post_required

es_index = settings.ELASTICSEARCH_INDICES['es_indices']
es_client = getElasticSearchClient()

logger = logging.getLogger(__name__)


### Render


@login_required
def contentAnalysis(request, tracker_id):
    """Return a render of the Content Analysis Page given the ID of the tracker. """
    tracker_data = getTrackerDetails(request, tracker_id, with_date_range=True)
    return render(request, 'youtube_tracker/contentAnalysis.html',
                  {
                      'trackerData': tracker_data,
                      'breadCrumbTrail': {'Dashboard': 'dashboardAnalytics'},
                      'pageTitle': 'Content Analysis',
                      'JSONContextData': json.dumps(tracker_data, indent=4, sort_keys=True, default=str),
                  })


### AJAX Calls - Graph & Sidebar Buttons


@ajax_post_required
def contentAnalysisDescLang(request):
    """Return language information for bar chart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    desc_lang_map = getVideoLanguageDistribution(video_ids)
    lead_desc = getMaxDictKey(desc_lang_map)
    return JsonResponse({'top_token': lead_desc, 'series': desc_lang_map})


@ajax_post_required
def contentAnalysisCategory(request):
    """Return category information for bar chart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    category_map = getVideoCategoryDistribution(video_ids, None, None)
    lead_category = getMaxDictKey(category_map)
    return JsonResponse({'top_token': lead_category, 'series': category_map})


@ajax_post_required
def contentAnalysisOpinionBar(request):
    """Return sentiment information for barchart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    opinion_map = getVideoOpinionDistribution(video_ids)
    overall_opinion = getMaxDictKey(opinion_map)
    return JsonResponse({'top_token': overall_opinion, 'series': opinion_map})


@ajax_post_required
def contentAnalysisKeyword(request):
    """Return leading keyword and n top keywords for word cloud & sidebar button."""
    lead_keyword = 'N/A'
    request_args = parseRequest(request)
    n = request_args['n']
    tracker_id = request_args['tracker_id']
    keywords = getTrackerKeywordDistribution(tracker_id, n)
    data = list({'x': k, 'y': v} for k, v in keywords)
    if len(keywords) > 0:
        lead_keyword = keywords[0][0]
    return JsonResponse({'top_token': lead_keyword, 'series': [{'data': data}]})


@ajax_post_required
def contentAnalysisEmoDist(request, max_nodes=1000):
    """Return emotion distribution data for emotion charts & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    # TODO Use below for emotion nodes visualization
    video_emotion_dist = list(Videos.objects.filter(video_id__in=video_ids).filter(content_top_emotion__isnull=False)
                              .values_list('video_id', 'content_top_emotion', 'content_top_score')
                              .order_by('-content_top_score'))[:max_nodes]
    videos_emotion_map = getVideoEmotionDistribution(video_ids)
    lead_emotion = getMaxDictKey(videos_emotion_map)
    return JsonResponse({'top_token': lead_emotion, 'series': videos_emotion_map})


# ## AJAX Calls - Video comments table


@ajax_post_required
def contentAnalysisVideoList(request):
    """Build a list VideoList data. Return videoList for video IDs (or all entries if unspecified)"""
    id = request.POST.get('tracker_id')

    video_id = Paginator(getTrackerVideoIDs(id), 2000)
    video_ids = getPageData(video_id)

    video_list = []
    videos = getVideos(video_ids, as_dict=True)
    dictionaryMerge(videos, getVideoEmotionDict(video_ids))
    # TODO Filter by selected category (language, video category, opinion, top keyword, or emotion)
    # Enable when language added to post processing - dictionaryMerge(video_details, getVideoLanguageDict(video_ids))
    # dictionaryMerge(video_details, getVideoOpinionDict(video_ids))
    # dictionaryMerge(video_details, getVideoKeywordDict(video_ids))
    video_list_values = videos.values()
    pop_headers = ["published_date", "category"]
    for item in video_list_values:
        [item.pop(key) for key in pop_headers]
        item['Title'] = item.pop('video_title')
        # item['Language'] = item.pop('language')
        item['Emotion'] = item.pop('emotion')
        video_list.append(item)
    return JsonResponse({'data': video_list})


@ajax_post_required
def contentAnalysisPaginatedComments(request):
    """Return ElasticSearch request for comment entries IDs (or all entries if unspecified)"""
    id = request.POST.get('videoId')
    fields = ['comment_displayed', 'commenter_name', 'published_date']
    es_index_name = es_index['es-comments']
    search = Search(index=es_index_name, using=es_client)
    request = search.filter(ES_Q('term', video_id__keyword=id)).source(fields)
    body = request.to_dict()
    result = es_client.search(index=es_index_name, body=body)
    comment_data = buildElasticSearchResponse(result)
    comment_page_object = Paginator(comment_data, 2000)
    comments = getPageData(comment_page_object)
    return JsonResponse({'data': comments})


@ajax_post_required
def contentAnalysisGetCommentReplies(request):
    """Given a unique comment ID, return a JSON Object with any replies associated to the comment."""
    request_args = parseRequest(request)
    comment_id = request_args['commentId']
    number_comments = 0
    fields = ['comment_id', 'comment_displayed', 'commenter_name', 'commenter_id', 'likes', 'published_date',
              'video_id', 'sentiment', 'total_replies', 'reply_to']
    request = getDateRangeCommentsRequest(comment_id, fields)
    # Disabled since this seems to rely on an obsolete buildElasticSearchResponse behavior
    # replies_data, number_comments = buildElasticSearchResponse(request, number_comments)
    # return JsonResponse({'series': replies_data})
    return


### AJAX Calls - Video details table

@ajax_post_required
def contentAnalysisVideoDetails(request):
    """Build a list VideoDetails data. Return videoDetails for video IDs (or all entries if unspecified)"""
    id = request.POST.get('tracker_id')

    video_id = Paginator(getTrackerVideoIDs(id), 2000)
    video_ids = getPageData(video_id)

    video_details = []
    videos = getVideos(video_ids, as_dict=True)
    dictionaryMerge(videos, getVideoOpinionDict(video_ids))
    dictionaryMerge(videos, getVideoLanguageDict(video_ids))
    dictionaryMerge(videos, getVideoEmotionDict(video_ids))
    video_details_values = videos.values()
    pop_headers = ["video_id", "published_date", "top_sentiment", "total_comments", "opinion_map"]
    for item in video_details_values:
        [item.pop(key) for key in pop_headers]
        item['Title'] = item.pop('video_title')
        item['Category'] = item.pop('category')
        item['Language'] = item['language'] if 'language' in item else 'Unknown'
        item['Emotion'] = item.pop('emotion')
        video_details.append(item)
    return JsonResponse({'data': video_details})


### Utility Functions - Individual videos dictionaries


def getVideoLanguageDict(video_ids):
    """Given a list of video IDs, return a dictionary of their descriptions' **respective** language and top terms."""
    content_data = {}
    videos_map = Search(index=es_index['es-vca'], using=es_client)
    videos_map = videos_map.filter(ES_Q({'terms': {'video_id.keyword': video_ids}})) \
        .source(['video_id', 'desc_lang'])
    for hits in videos_map.scan():
        if hits['desc_lang'] is not None:
            content_data[hits['video_id']] = {'language': ''}
            try:
                content_data[hits['video_id']]['language'] = Locale(hits['desc_lang']).english_name
            except Exception as e:
                logger.error(e)
                if hits['desc_lang'] == "UNK":
                    content_data[hits['video_id']]['language'] = "Unknown"
                else:
                    content_data[hits['video_id']]['language'] = hits['desc_lang']
    return content_data


def getVideoOpinionDict(video_ids):
    """Given a list of video IDs, return a dictionary of their **respective** number of comments for each sentiment (positive, negative, neutral).."""
    opinion = {}
    sentiment_threshold = 0.1
    for video in video_ids:
        opinion[video] = {'opinion_map': {'Negative': 0, 'Positive': 0, 'Neutral': 0}, 'total_comments': 0}
    request = getDateRangeCommentsRequest(video_ids, ['comment_id', 'video_id'])
    op_neg = request.filter(ES_Q({'range': {'sentiment': {'lt': -sentiment_threshold}}}))
    op_neg.aggs.bucket('group_by_video', 'terms', field='video_id.keyword')
    op_neg_res = op_neg.execute()
    for res in op_neg_res.aggregations.group_by_video.buckets:
        opinion[res['key']]['opinion_map']['Negative'] = res['doc_count']
        opinion[res['key']]['total_comments'] += res['doc_count']
    op_pos = request.filter(ES_Q({'range': {'sentiment': {'gt': sentiment_threshold}}}))
    op_pos.aggs.bucket('group_by_video', 'terms', field='video_id.keyword')
    op_pos_res = op_pos.execute()
    for res in op_pos_res.aggregations.group_by_video.buckets:
        opinion[res['key']]['opinion_map']['Positive'] = res['doc_count']
        opinion[res['key']]['total_comments'] += res['doc_count']
    op_neut = request.filter(ES_Q({'range': {'sentiment': {'gte': -sentiment_threshold, 'lt': sentiment_threshold}}}))
    op_neut.aggs.bucket('group_by_video', 'terms', field='video_id.keyword')
    op_neut_res = op_neut.execute()
    for res in op_neut_res.aggregations.group_by_video.buckets:
        opinion[res['key']]['opinion_map']['Neutral'] = res['doc_count']
        opinion[res['key']]['total_comments'] += res['doc_count']
    for video_id, video in opinion.items():
        opinion[video_id]['top_sentiment'] = getMaxDictKey(opinion[video_id]['opinion_map'])
    return opinion


def getVideoKeywordDict(video_ids):
    """Given a list of video IDs, return a dictionary of their **respective** top keyword."""
    keyword_map = {}
    analysis_object = VideoContentAnalysis.objects.filter(video_id__in=video_ids)
    for video in analysis_object:
        keyword_map[video.video_id] = {'top_keyword': video.top_term}
    return keyword_map


def getVideoEmotionDict(video_ids):
    """Given a list of video IDs, return a dictionary of their **respective** leading emotion."""
    emotion_map = {video_id: {'emotion': 'Unknown'} for video_id in video_ids}
    request = getDateRangeVideoRequest(video_ids, ['video_id', 'content_top_emotion'])
    for hits in request.scan():
        if hits['content_top_emotion'] is not None:
            emotion_map[hits['video_id']]['emotion'] = hits['content_top_emotion'].capitalize()
    return emotion_map


### Utility Functions - Aggregated video features distributions


def getVideoLanguageDistribution(video_ids):
    """Given a list of video IDs, return a dictionary of their language distribution as 'Language': [number of videos] pairs."""
    desc_lang_map = {}
    desc_lang = Search(index=es_index['es-vca'], using=es_client)
    desc_lang = desc_lang.filter(ES_Q({'terms': {'video_id.keyword': video_ids}})).source(['video_id', 'desc_lang'])
    desc_lang.aggs.bucket("group_by_desc_lang", 'terms', field='desc_lang.keyword')
    response = desc_lang.execute()
    for hits in response.aggregations.group_by_desc_lang.buckets:
        try:
            desc_lang_map[Locale(hits['key']).english_name] = hits['doc_count']
        except Exception as e:
            logger.error(e)
            if hits['key'] == "UNK":
                desc_lang_map["Unknown"] = hits['doc_count']
            else:
                desc_lang_map[hits['key']] = hits['doc_count']
    return desc_lang_map


def getVideoCategoryDistribution(video_ids, start_date=None, end_date=None):
    """Given a list of video IDs and (optional) date bracket, return a dictionary of their category distribution as 'Category': [number of videos] pairs."""
    category_map = {}
    request = getDateRangeVideoRequest(video_ids, ['video_id', 'category'])
    request.aggs.bucket("group_by_category", 'terms', field='category.keyword')
    response = request.execute()
    for hits in response.aggregations.group_by_category.buckets:
        category_map[hits['key']] = hits['doc_count']
    return category_map


def getVideoOpinionDistribution(video_ids):
    """Given a list of video IDs, return a dictionary of their opinion distribution as 'Sentiment': [number of videos] pairs, based on the **average** sentiment of its comments."""
    fields = ['comment_id', 'video_id', 'sentiment']
    request = getDateRangeCommentsRequest(video_ids, fields)
    request.aggs.bucket('group_by_video', 'terms', field='video_id.keyword', size=2147483647)
    request.aggs['group_by_video'].metric('average_opinion', 'avg', field='sentiment')
    results = request.execute()
    sentiment_threshold = 0.1
    opinion_map = {'Negative': 0, 'Positive': 0, 'Neutral': 0}
    for hits in results.aggregations.group_by_video.buckets:
        if hits.average_opinion.value < -sentiment_threshold:
            opinion_map['Negative'] += 1
        elif hits.average_opinion.value > sentiment_threshold:
            opinion_map['Positive'] += 1
        else:
            opinion_map['Neutral'] += 1
    return opinion_map


def getTrackerKeywordDistribution(tracker_id, n=20):
    """Given a tracker ID, return its top n keywords as a list of ([keyword], [number of appearances]) pairs."""
    keywords = {}
    analysis_object = TrackerContentAnalysis.objects.get(tracker_id=tracker_id)
    if analysis_object:
        keywords = analysis_object.tracker_top_terms
    keywords = sorted(keywords.items(), key=lambda item: item[1], reverse=True)[:n]
    return keywords


def getVideoEmotionDistribution(video_ids):
    """Given a list of video IDs, return a dictionary of their emotion distribution as 'Emotion': [number of videos] pairs."""
    emotion_map = {}
    request = getDateRangeVideoRequest(video_ids, ['video_id', 'content_top_emotion'])
    request.aggs.bucket("group_by_emotion", 'terms', field='content_top_emotion.keyword')
    response = request.execute()
    for hits in response.aggregations.group_by_emotion.buckets:
        emotion_map[hits['key']] = hits['doc_count']
    return emotion_map

### Utility Functions - Other
