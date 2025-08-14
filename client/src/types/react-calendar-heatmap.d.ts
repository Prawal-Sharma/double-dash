declare module 'react-calendar-heatmap' {
  import React from 'react';

  interface CalendarHeatmapProps {
    values: Array<{ date: string | Date; count?: number }>;
    startDate: string | Date;
    endDate: string | Date;
    gutterSize?: number;
    horizontal?: boolean;
    showMonthLabels?: boolean;
    showWeekdayLabels?: boolean;
    showOutOfRangeDays?: boolean;
    tooltipDataAttrs?: (value: any) => any;
    titleForValue?: (value: any) => string;
    classForValue?: (value: any) => string;
    monthLabels?: string[];
    weekdayLabels?: string[];
    onClick?: (value: any) => void;
    onMouseOver?: (event: any, value: any) => void;
    onMouseLeave?: (event: any, value: any) => void;
    transformDayElement?: (element: any, value: any, index: number) => React.ReactElement;
  }

  export default class CalendarHeatmap extends React.Component<CalendarHeatmapProps> {}
}