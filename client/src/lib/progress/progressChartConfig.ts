import type { ChartConfiguration } from "chart.js"
import { DateTime } from "luxon";
import type { ExtendedPChartDataPoint, PChartTLabel, PChartTType } from '@/lib/progress/progressChartTypes'

const X_AXIS_MIN = new Date('2024-01-01').getTime()
const X_AXIS_MAX = new Date('2025-01-02').getTime()
const Y_AXIS_MIN = 0

const chartConfig: ChartConfiguration<PChartTType, ExtendedPChartDataPoint[], PChartTLabel> = {
  type: 'line',
  data: {
    datasets: [],
  },
  options: {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        position: 'top',
        type: "time",
        time: {
          displayFormats: {
            month: 'MMM',
            year: ''
          },
          unit: 'month'
        },
        min: X_AXIS_MIN,
        max: X_AXIS_MAX,
        title: {
          display: true,
          text: "Day in year"
        }
      },
      y: {
        min: Y_AXIS_MIN,
        title: {
          display: true,
          text: 'Mileage'
        },
        ticks: {
          callback: (value) => `${Math.round(value as number)} km`
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        boxPadding: 10,
        callbacks: {
          title: function (dataset) {
            return (dataset[0]?.raw as ExtendedPChartDataPoint).originalDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
          },
          label: function (item) {
            return Math.round((item.raw as ExtendedPChartDataPoint).step) + " km"
          },
          afterLabel: function (item) {
            return (item.raw as ExtendedPChartDataPoint).name
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
        },
        pan: {
          enabled: true,

        },
        limits: {
          x: { min: X_AXIS_MIN, max: X_AXIS_MAX },
          y: { min: Y_AXIS_MIN, max: 'original' }
        },
      }
    }
  }
}

export { chartConfig }