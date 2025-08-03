import { Activity } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, subMonths, isWithinInterval } from 'date-fns';

// Conversion utilities
export const convertMetersToMiles = (meters: number): number => meters / 1609.34;
export const convertMetersToFeet = (meters: number): number => meters * 3.28084;
export const convertSecondsToMinutes = (seconds: number): number => seconds / 60;
export const convertSecondsToHours = (seconds: number): number => seconds / 3600;

// Pace calculation (minutes per mile)
export const calculatePacePerMile = (timeInSeconds: number, distanceInMeters: number): number => {
  const miles = convertMetersToMiles(distanceInMeters);
  const minutes = convertSecondsToMinutes(timeInSeconds);
  return miles > 0 ? minutes / miles : 0;
};

// Format pace as MM:SS
export const formatPace = (paceInMinutes: number): string => {
  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.round((paceInMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Calculate running efficiency (distance per minute)
export const calculateEfficiency = (distanceInMeters: number, timeInSeconds: number): number => {
  const miles = convertMetersToMiles(distanceInMeters);
  const minutes = convertSecondsToMinutes(timeInSeconds);
  return minutes > 0 ? miles / minutes : 0;
};

// Group activities by time period
export const groupActivitiesByMonth = (activities: Activity[]): { [key: string]: Activity[] } => {
  return activities.reduce((acc, activity) => {
    const date = parseISO(activity.start_date);
    const monthKey = format(date, 'yyyy-MM');
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(activity);
    return acc;
  }, {} as { [key: string]: Activity[] });
};

export const groupActivitiesByWeek = (activities: Activity[]): { [key: string]: Activity[] } => {
  return activities.reduce((acc, activity) => {
    const date = parseISO(activity.start_date);
    const weekKey = format(startOfWeek(date), 'yyyy-MM-dd');
    if (!acc[weekKey]) acc[weekKey] = [];
    acc[weekKey].push(activity);
    return acc;
  }, {} as { [key: string]: Activity[] });
};

// Calculate monthly statistics
export const calculateMonthlyStats = (activities: Activity[]) => {
  const grouped = groupActivitiesByMonth(activities);
  
  return Object.entries(grouped).map(([month, monthActivities]) => ({
    month,
    monthName: format(parseISO(`${month}-01`), 'MMM yyyy'),
    totalRuns: monthActivities.length,
    totalDistance: monthActivities.reduce((sum, act) => sum + convertMetersToMiles(act.distance), 0),
    totalTime: monthActivities.reduce((sum, act) => sum + convertSecondsToHours(act.moving_time), 0),
    totalElevation: monthActivities.reduce((sum, act) => sum + convertMetersToFeet(act.total_elevation_gain), 0),
    avgPace: monthActivities.length > 0 ? 
      monthActivities.reduce((sum, act) => sum + calculatePacePerMile(act.moving_time, act.distance), 0) / monthActivities.length : 0,
    avgDistance: monthActivities.length > 0 ?
      monthActivities.reduce((sum, act) => sum + convertMetersToMiles(act.distance), 0) / monthActivities.length : 0,
  })).sort((a, b) => a.month.localeCompare(b.month));
};

// Calculate weekly statistics
export const calculateWeeklyStats = (activities: Activity[], weeks: number = 12) => {
  const now = new Date();
  const weeksData = [];
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subMonths(now, Math.floor(i / 4)));
    const weekEnd = endOfWeek(weekStart);
    
    const weekActivities = activities.filter(activity => {
      const activityDate = parseISO(activity.start_date);
      return isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
    });
    
    weeksData.push({
      week: format(weekStart, 'yyyy-MM-dd'),
      weekLabel: format(weekStart, 'MMM dd'),
      totalRuns: weekActivities.length,
      totalDistance: weekActivities.reduce((sum, act) => sum + convertMetersToMiles(act.distance), 0),
      totalTime: weekActivities.reduce((sum, act) => sum + convertSecondsToHours(act.moving_time), 0),
      avgPace: weekActivities.length > 0 ? 
        weekActivities.reduce((sum, act) => sum + calculatePacePerMile(act.moving_time, act.distance), 0) / weekActivities.length : 0,
    });
  }
  
  return weeksData;
};

// Pace distribution analysis
export const analyzePaceDistribution = (activities: Activity[]) => {
  const paces = activities.map(activity => calculatePacePerMile(activity.moving_time, activity.distance))
    .filter(pace => pace > 0 && pace < 20); // Filter out invalid paces
  
  const buckets = [
    { range: '< 6:00', min: 0, max: 6, count: 0 },
    { range: '6:00-7:00', min: 6, max: 7, count: 0 },
    { range: '7:00-8:00', min: 7, max: 8, count: 0 },
    { range: '8:00-9:00', min: 8, max: 9, count: 0 },
    { range: '9:00-10:00', min: 9, max: 10, count: 0 },
    { range: '10:00+', min: 10, max: Infinity, count: 0 },
  ];
  
  paces.forEach(pace => {
    const bucket = buckets.find(b => pace >= b.min && pace < b.max);
    if (bucket) bucket.count++;
  });
  
  return buckets;
};

// Distance distribution analysis
export const analyzeDistanceDistribution = (activities: Activity[]) => {
  const distances = activities.map(activity => convertMetersToMiles(activity.distance));
  
  const buckets = [
    { range: '< 3 miles', min: 0, max: 3, count: 0 },
    { range: '3-5 miles', min: 3, max: 5, count: 0 },
    { range: '5-10 miles', min: 5, max: 10, count: 0 },
    { range: '10-15 miles', min: 10, max: 15, count: 0 },
    { range: '15+ miles', min: 15, max: Infinity, count: 0 },
  ];
  
  distances.forEach(distance => {
    const bucket = buckets.find(b => distance >= b.min && distance < b.max);
    if (bucket) bucket.count++;
  });
  
  return buckets;
};

// Heart rate analysis (for activities with HR data)
export const analyzeHeartRateZones = (activities: Activity[]) => {
  const hrActivities = activities.filter(act => act.has_heartrate && act.average_heartrate && act.max_heartrate);
  
  if (hrActivities.length === 0) return null;
  
  const zones = [
    { zone: 'Recovery', min: 0, max: 140, count: 0, color: '#28a745' },
    { zone: 'Aerobic', min: 140, max: 160, count: 0, color: '#ffc107' },
    { zone: 'Threshold', min: 160, max: 180, count: 0, color: '#fd7e14' },
    { zone: 'VO2 Max', min: 180, max: 200, count: 0, color: '#dc3545' },
    { zone: 'Anaerobic', min: 200, max: Infinity, count: 0, color: '#6f42c1' },
  ];
  
  hrActivities.forEach(activity => {
    const avgHR = activity.average_heartrate!;
    const zone = zones.find(z => avgHR >= z.min && avgHR < z.max);
    if (zone) zone.count++;
  });
  
  return zones;
};

// Performance trends
export const calculatePerformanceTrends = (activities: Activity[]) => {
  const monthlyStats = calculateMonthlyStats(activities);
  
  if (monthlyStats.length < 2) return null;
  
  const latest = monthlyStats[monthlyStats.length - 1];
  const previous = monthlyStats[monthlyStats.length - 2];
  
  return {
    distanceTrend: ((latest.totalDistance - previous.totalDistance) / previous.totalDistance * 100),
    paceTrend: ((latest.avgPace - previous.avgPace) / previous.avgPace * 100),
    volumeTrend: ((latest.totalRuns - previous.totalRuns) / previous.totalRuns * 100),
    elevationTrend: ((latest.totalElevation - previous.totalElevation) / previous.totalElevation * 100),
  };
};

// Personal records tracking
export const findPersonalRecords = (activities: Activity[]) => {
  const distances = [1, 3.1, 6.2, 13.1, 26.2]; // 1 mile, 5K, 10K, half marathon, marathon in miles
  
  return distances.map(targetDistance => {
    // Find activities within 10% of target distance
    const candidates = activities.filter(activity => {
      const activityDistance = convertMetersToMiles(activity.distance);
      return Math.abs(activityDistance - targetDistance) / targetDistance <= 0.1;
    });
    
    if (candidates.length === 0) return null;
    
    // Find fastest time
    const fastest = candidates.reduce((best, current) => 
      current.moving_time < best.moving_time ? current : best
    );
    
    const pace = calculatePacePerMile(fastest.moving_time, fastest.distance);
    
    return {
      distance: targetDistance,
      distanceLabel: targetDistance === 1 ? '1 Mile' :
                   targetDistance === 3.1 ? '5K' :
                   targetDistance === 6.2 ? '10K' :
                   targetDistance === 13.1 ? 'Half Marathon' :
                   targetDistance === 26.2 ? 'Marathon' : `${targetDistance} miles`,
      time: fastest.moving_time,
      timeFormatted: `${Math.floor(fastest.moving_time / 3600)}:${Math.floor((fastest.moving_time % 3600) / 60).toString().padStart(2, '0')}:${(fastest.moving_time % 60).toString().padStart(2, '0')}`,
      pace: formatPace(pace),
      date: format(parseISO(fastest.start_date), 'MMM dd, yyyy'),
      activity: fastest,
    };
  }).filter(record => record !== null);
};