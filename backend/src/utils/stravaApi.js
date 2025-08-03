const axios = require('axios');

class StravaAPI {
  constructor() {
    this.baseURL = 'https://www.strava.com/api/v3';
    this.oauthURL = 'https://www.strava.com/oauth/token';
  }

  async exchangeCodeForTokens(code) {
    try {
      console.log('Attempting Strava token exchange with code:', code?.substring(0, 10) + '...');
      
      // Validate inputs
      if (!code) {
        throw new Error('Authorization code is required');
      }
      
      if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
        throw new Error('Strava client credentials not configured');
      }
      
      const response = await axios.post(this.oauthURL, {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Strava token exchange successful');
      return response.data;
    } catch (error) {
      console.error('Strava token exchange error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        const errorMsg = errorData?.message || errorData?.errors?.[0]?.code || 'Invalid authorization code';
        
        // Check for specific error types
        if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
          throw new Error(`Authorization code is invalid or expired. Please try authorizing again.`);
        } else if (errorMsg.includes('used')) {
          throw new Error(`Authorization code has already been used. Please try authorizing again.`);
        } else {
          throw new Error(`Strava authorization failed: ${errorMsg}`);
        }
      }
      
      if (error.response?.status === 429) {
        throw new Error('Too many requests to Strava. Please wait a moment and try again.');
      }
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Connection to Strava timed out. Please try again.');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Strava service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(`Strava token exchange failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(this.oauthURL, {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Strava token refresh failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getActivities(accessToken, page = 1, perPage = 200) {
    try {
      const response = await axios.get(`${this.baseURL}/athlete/activities`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          per_page: perPage,
          page: page,
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Strava access token expired');
      }
      throw new Error(`Failed to fetch Strava activities: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAllActivities(accessToken) {
    let page = 1;
    let allActivities = [];
    let hasMore = true;

    while (hasMore) {
      const activities = await this.getActivities(accessToken, page);
      
      if (activities.length > 0) {
        allActivities = allActivities.concat(activities);
        page++;
      } else {
        hasMore = false;
      }
      
      // Safety check to prevent infinite loops
      if (page > 100) {
        console.warn('Reached maximum page limit (100) when fetching Strava activities');
        break;
      }
    }

    return allActivities;
  }

  async getActivitiesSince(accessToken, afterTimestamp) {
    try {
      const params = {
        per_page: 200 // Get more activities per request for efficiency
      };

      // If we have a timestamp, only get activities after that date
      if (afterTimestamp) {
        params.after = afterTimestamp;
      }

      const response = await axios.get(`${this.baseURL}/athlete/activities`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Strava access token expired');
      }
      throw new Error(`Failed to fetch Strava activities since ${afterTimestamp}: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAthleteProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/athlete`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch athlete profile: ${error.response?.data?.message || error.message}`);
    }
  }

  formatActivityForStorage(activity, userId) {
    return {
      userId: userId,
      activityId: activity.id.toString(),
      achievement_count: activity.achievement_count,
      athlete: activity.athlete,
      athlete_id: activity.athlete?.id,
      athlete_count: activity.athlete_count,
      average_cadence: activity.average_cadence,
      average_heartrate: activity.average_heartrate,
      average_speed: activity.average_speed,
      comment_count: activity.comment_count,
      commute: activity.commute,
      display_hide_heartrate_option: activity.display_hide_heartrate_option,
      distance: activity.distance,
      elapsed_time: activity.elapsed_time,
      elev_high: activity.elev_high,
      elev_low: activity.elev_low,
      end_latlng: activity.end_latlng,
      end_lat: activity.end_latlng?.[0],
      end_lng: activity.end_latlng?.[1],
      external_id: activity.external_id,
      flagged: activity.flagged,
      from_accepted_tag: activity.from_accepted_tag,
      gear_id: activity.gear_id,
      has_heartrate: activity.has_heartrate,
      has_kudoed: activity.has_kudoed,
      heartrate_opt_out: activity.heartrate_opt_out,
      kudos_count: activity.kudos_count,
      location_city: activity.location_city,
      location_country: activity.location_country,
      location_state: activity.location_state,
      manual: activity.manual,
      map: activity.map,
      summary_polyline: activity.map?.summary_polyline,
      max_heartrate: activity.max_heartrate,
      max_speed: activity.max_speed,
      moving_time: activity.moving_time,
      name: activity.name,
      photo_count: activity.photo_count,
      pr_count: activity.pr_count,
      private: activity.private,
      resource_state: activity.resource_state,
      sport_type: activity.sport_type,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      start_latlng: activity.start_latlng,
      start_lat: activity.start_latlng?.[0],
      start_lng: activity.start_latlng?.[1],
      suffer_score: activity.suffer_score,
      timezone: activity.timezone,
      total_elevation_gain: activity.total_elevation_gain,
      total_photo_count: activity.total_photo_count,
      trainer: activity.trainer,
      type: activity.type,
      upload_id: activity.upload_id,
      upload_id_str: activity.upload_id_str,
      utc_offset: activity.utc_offset,
      visibility: activity.visibility,
      workout_type: activity.workout_type
    };
  }
}

module.exports = new StravaAPI();