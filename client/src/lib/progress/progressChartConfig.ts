import type { ChartConfiguration } from "chart.js"
import { DateTime } from "luxon";
import type { ExtendedPChartDataPoint, PChartTLabel, PChartTType } from '@/lib/progress/progressChartTypes'


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
        min: '2024-01-01',
        max: '2025-01-02',
        title: {
          display: true,
          text: "Day in year"
        }
      },
      y: {
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
        position: 'right',
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
          enabled: false,

        }
      }
    }
  }
}

export { chartConfig }