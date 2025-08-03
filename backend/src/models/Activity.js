const dynamoDB = require('../config/database');

class Activity {
  constructor(data) {
    Object.assign(this, data);
  }

  static async findByUserId(userId) {
    try {
      const result = await dynamoDB.query({
        TableName: 'Activities',
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: {
          ':u': userId
        }
      }).promise();

      return result.Items.map(item => new Activity(item));
    } catch (error) {
      throw new Error(`Failed to find activities for user: ${error.message}`);
    }
  }

  static async create(activityData) {
    try {
      await dynamoDB.put({
        TableName: 'Activities',
        Item: activityData,
        ConditionExpression: 'attribute_not_exists(activityId)',
      }).promise();

      return new Activity(activityData);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        // Activity already exists, skip silently
        return null;
      }
      throw new Error(`Failed to create activity: ${error.message}`);
    }
  }

  static async bulkCreate(activities) {
    const results = [];
    
    for (const activityData of activities) {
      try {
        const activity = await Activity.create(activityData);
        if (activity) {
          results.push(activity);
        }
      } catch (error) {
        console.error(`Failed to create activity ${activityData.activityId}:`, error.message);
      }
    }

    return results;
  }

  static calculateSummary(activities) {
    const summary = {
      totalActivities: activities.length,
      totalDistance: 0,
      totalElevation: 0,
      totalMovingTime: 0,
      activityTypes: {}
    };

    activities.forEach((activity) => {
      summary.totalDistance += activity.distance || 0;
      summary.totalElevation += activity.total_elevation_gain || 0;
      summary.totalMovingTime += activity.moving_time || 0;

      const type = activity.type;
      summary.activityTypes[type] = (summary.activityTypes[type] || 0) + 1;
    });

    return summary;
  }

  static filterByDateRange(activities, startDate, endDate) {
    return activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }

  static filterByType(activities, type) {
    return activities.filter(activity => activity.type === type);
  }

  static async findMostRecentByUserId(userId) {
    try {
      const params = {
        TableName: 'Activities',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      const result = await dynamoDB.scan(params).promise();
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      // Sort by start_date descending and return the most recent
      const sortedActivities = result.Items.sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      );

      return sortedActivities[0];
    } catch (error) {
      throw new Error(`Failed to find most recent activity: ${error.message}`);
    }
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Activity;