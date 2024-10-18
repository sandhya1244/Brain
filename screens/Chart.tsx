import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { fetchInjuryData } from '../automatic_db'; // Adjust the import path
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;

const ChartScreen = () => {
  const [barChartData, setBarChartData] = useState(null);
  const [directionChartData, setDirectionChartData] = useState(null);
  const [totalInjuries, setTotalInjuries] = useState(0);
  const [pieChartData, setPieChartData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('month'); // Default to month

  useEffect(() => {
    const retrieveData = () => {
      fetchInjuryData((data) => {
        const totalCount = data.reduce((sum, record) => {
          const count = Number(record.injury_count);
          return sum + (isNaN(count) ? 0 : count);
        }, 0);
        setTotalInjuries(totalCount);

        // Process data based on selected time frame
        const processedData = filterAndProcessData(data, timeFrame);
        setBarChartData(processedData.barChartData);
        setDirectionChartData(processedData.directionChartData);
        setPieChartData(processedData.pieChartData);
      });
    };

    retrieveData();
  }, [timeFrame]);

  const filterAndProcessData = (data, timeFrame) => {
    const dayCounts = {};
    const weekCounts = Array(7).fill(0);
    const monthCounts = Array(12).fill(0);
    const yearCounts = {};
    const directionCounts = {};

    data.forEach((record) => {
      const date = moment(record.date, 'M/D/YYYY');
      const count = Number(record.injury_count) || 0;
      const day = date.format('YYYY-MM-DD');

      if (timeFrame === 'day') {
        dayCounts[day] = (dayCounts[day] || 0) + count;
      } else if (timeFrame === 'week') {
        weekCounts[date.day()] += count;
      } else if (timeFrame === 'month') {
        monthCounts[date.month()] += count;
      } else if (timeFrame === 'year') {
        const year = date.year();
        yearCounts[year] = (yearCounts[year] || 0) + count;
      }

      const direction = record.direction;
      directionCounts[direction] = (directionCounts[direction] || 0) + count;
    });

    let barData;
    if (timeFrame === 'day') {
      barData = {
        labels: Object.keys(dayCounts),
        datasets: [{ data: Object.values(dayCounts) }],
      };
    } else if (timeFrame === 'week') {
      barData = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{ data: weekCounts }],
      };
    } else if (timeFrame === 'month') {
      barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{ data: monthCounts }],
      };
    } else if (timeFrame === 'year') {
      barData = {
        labels: Object.keys(yearCounts),
        datasets: [{ data: Object.values(yearCounts) }],
      };
    }

    const directionData = {
      labels: Object.keys(directionCounts),
      datasets: [{ data: Object.values(directionCounts) }],
    };

    const pieData = Object.keys(directionCounts).map((direction) => ({
      name: direction,
      population: directionCounts[direction],
      color: getRandomColor(),
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }));

    return { barChartData: barData, directionChartData: directionData, pieChartData: pieData };
  };

  const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  return (
    <ImageBackground
      source={require('../assets/background_img.jpg')}
      style={styles.backgroundImage}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.decorativeContainer}>
          <TouchableOpacity style={styles.decorativeButton}>
            <Text style={styles.decorativeButtonText}>TOTAL INJURIES: {totalInjuries}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navBar}>
          {['day', 'week', 'month', 'year'].map((frame) => (
            <TouchableOpacity key={frame} onPress={() => setTimeFrame(frame)} style={styles.navButton}>
              <Text style={styles.navButtonText}>{frame.charAt(0).toUpperCase() + frame.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {timeFrame === 'day' && (!barChartData || barChartData.datasets[0].data.length === 0) ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No Data Available for Selected Day</Text>
          </View>
        ) : (
          <>
            {barChartData && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} Injuries (Bar Chart)</Text>
                <BarChart
                  data={barChartData}
                  width={screenWidth * 0.9}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              </View>
            )}

            {directionChartData && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Direction-wise Injuries (Bar Chart)</Text>
                <BarChart
                  data={directionChartData}
                  width={screenWidth * 0.9}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              </View>
            )}

            {pieChartData.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}-wise Direction-wise Injuries Ratio (Pie Chart)</Text>
                <PieChart
                  data={pieChartData}
                  width={screenWidth * 0.9}
                  height={220}
                  chartConfig={pieChartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const pieChartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
  },
  decorativeContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#7393B3',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  decorativeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#87CEEB',
    alignItems: 'center',
  },
  decorativeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  navButton: {
    backgroundColor: '#87CEEB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  chartContainer: {
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: '#f8d7da',
    borderRadius: 10,
    marginTop: 20,
    padding: 20,
    width: '90%',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#721c24',
    textAlign: 'center',
  },
});

export default ChartScreen;
