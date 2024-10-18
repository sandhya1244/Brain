import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { retrieveData } from '../db';  // Import your data retrieval function

const screenWidth = Dimensions.get('window').width;

// Severity mapping
const severityMap = {
  'mild': 1,
  'moderate': 2,
  'severe': 3,
};

const reverseSeverityMap = {
  1: 'mild',
  2: 'moderate',
  3: 'severe',
};

const DetailsScreen: React.FC = () => {
  const [barChartData, setBarChartData] = useState(null);
  const [totalSeverityData, setTotalSeverityData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [totalInjuries, setTotalInjuries] = useState(0);
  const [averageSeverityLabel, setAverageSeverityLabel] = useState('');
  const [timeFrame, setTimeFrame] = useState('month');

  useEffect(() => {
    retrieveData()
      .then(data => {
        processChartData(data);
      })
      .catch(error => {
        console.log('Error fetching data:', error);
      });
  }, [timeFrame]);

  const processChartData = (data) => {
    let labels = [];
    let counts = [];
    let severitySum = [];
    let pieData = [];
    let filteredData = [];
  
    if (timeFrame === 'week') {
      const startDate = getLatestWeekStartDate();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Saturday of the same week
  
      filteredData = data.filter(item => {
        const injuryDate = new Date(item.injuryDate);
        return injuryDate >= startDate && injuryDate <= endDate;
      });
  
      const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekCounts = Array(7).fill(0);
      const severitySumByDay = Array(7).fill(0);
  
      filteredData.forEach(item => {
        const dayOfWeek = new Date(item.injuryDate).getDay(); // 0 = Sunday, 6 = Saturday
        weekCounts[dayOfWeek] += 1;
  
        const severityValue = severityMap[item.severity.toLowerCase()] || 0;
        severitySumByDay[dayOfWeek] += severityValue;
      });
  
      labels = weekLabels;
      counts = weekCounts;
      severitySum = severitySumByDay;
  
      pieData = weekLabels.map((label, index) => ({
        name: label,
        population: weekCounts[index],
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      }));
  
    } else if (timeFrame === 'month') {
      filteredData = data.filter(item => {
        const injuryDate = new Date(item.injuryDate);
        const currentMonth = new Date().getMonth();
        return injuryDate.getMonth() === currentMonth;
      });
  
      const monthCounts = Array(12).fill(0);
      const severitySumByMonth = Array(12).fill(0);
  
      filteredData.forEach(item => {
        const month = new Date(item.injuryDate).getMonth();
        monthCounts[month] += 1;
  
        const severityValue = severityMap[item.severity.toLowerCase()] || 0;
        severitySumByMonth[month] += severityValue;
      });
  
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      counts = monthCounts;
      severitySum = severitySumByMonth;
  
      pieData = labels.map((label, index) => ({
        name: label,
        population: monthCounts[index],
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      }));
  
    } else if (timeFrame === 'year') {
      filteredData = data.filter(item => {
        const injuryDate = new Date(item.injuryDate);
        const currentYear = new Date().getFullYear();
        return injuryDate.getFullYear() === currentYear;
      });
  
      const yearCounts = {};
      const severitySumByYear = {};
  
      filteredData.forEach(item => {
        const year = new Date(item.injuryDate).getFullYear();
        if (!yearCounts[year]) {
          yearCounts[year] = 0;
          severitySumByYear[year] = 0;
        }
        yearCounts[year] += 1;
  
        const severityValue = severityMap[item.severity.toLowerCase()] || 0;
        severitySumByYear[year] += severityValue;
      });
  
      labels = Object.keys(yearCounts);
      counts = Object.values(yearCounts);
      severitySum = Object.values(severitySumByYear);
  
      pieData = labels.map((label, index) => ({
        name: label,
        population: yearCounts[label],
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      }));
    }
  
    // Update total injuries and average severity based on filtered data
    setTotalInjuries(filteredData.length);
  
    const totalSeveritySum = severitySum.reduce((a, b) => a + b, 0);
    const averageSeverity = totalSeveritySum / (filteredData.length || 1);
    setAverageSeverityLabel(reverseSeverityMap[Math.round(averageSeverity)]);
  
    // Update chart data
    setBarChartData({
      labels,
      datasets: [{ data: counts }],
    });
  
    setTotalSeverityData({
      labels,
      datasets: [{ data: severitySum }],
    });
  
    const mildCount = filteredData.filter(item => item.severity.toLowerCase() === 'mild').length;
    const moderateCount = filteredData.filter(item => item.severity.toLowerCase() === 'moderate').length;
    const severeCount = filteredData.filter(item => item.severity.toLowerCase() === 'severe').length;
  
    const totalCount = mildCount + moderateCount + severeCount;
    const mildPercentage = ((mildCount / totalCount) * 100) || 0;
    const moderatePercentage = ((moderateCount / totalCount) * 100) || 0;
    const severePercentage = ((severeCount / totalCount) * 100) || 0;
  
    setPieChartData([
      {
        name: `Mild ${mildPercentage.toFixed(2)}%`,
        population: mildCount,
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: `Moderate ${moderatePercentage.toFixed(2)}%`,
        population: moderateCount,
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
      {
        name: `Severe ${severePercentage.toFixed(2)}%`,
        population: severeCount,
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      },
    ]);
  };
  
  const getLatestWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek); // Move back to the most recent Sunday
    return lastSunday;
  };

  const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  return (
    <ImageBackground
      //source={require('../assets/background_img.jpg')} // Add your image path here
      //style={styles.backgroundImage} // Apply background image style
    >
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setTimeFrame('week')} style={timeFrame === 'week' ? styles.underline : null}>
          <Text style={styles.navButtonText}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTimeFrame('month')} style={timeFrame === 'month' ? styles.underline : null}>
          <Text style={styles.navButtonText}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTimeFrame('year')} style={timeFrame === 'year' ? styles.underline : null}>
          <Text style={styles.navButtonText}>Year</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.decorativeContainer}>
          <TouchableOpacity style={styles.decorativeButton}>
            <Text style={styles.decorativeButtonText}>TOTAL INJURIES: {totalInjuries}</Text>
            <Text style={styles.averageSeverityText}>Average Severity: {averageSeverityLabel}</Text>
          </TouchableOpacity>
        </View>

        {barChartData && (
          <ScrollView horizontal contentContainerStyle={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Injuries ({timeFrame} view) - Bar Chart</Text>
              <BarChart
                data={barChartData}
                width={500} // Adjust width to enable horizontal scrolling
                height={220}
                chartConfig={lineBarChartConfig}
                style={styles.chart}
              />
            </View>
          </ScrollView>
        )}

        {/* New Bar Chart for Total Severity */}
        {totalSeverityData && (
          <ScrollView horizontal contentContainerStyle={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Total Severity ({timeFrame} view) - Bar Chart</Text>
              <BarChart
                data={totalSeverityData}
                width={500} // Adjust width to enable horizontal scrolling
                height={220}
                chartConfig={lineBarChartConfig}
                style={styles.chart}
              />
            </View>
          </ScrollView>
        )}

        {pieChartData && (
          <ScrollView horizontal contentContainerStyle={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Injuries Severity ({timeFrame} view) - Pie Chart</Text>
              <PieChart
                data={pieChartData}
                width={500} // Adjust width to enable horizontal scrolling
                height={220}
                chartConfig={pieChartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const lineBarChartConfig = {
  backgroundGradientFrom: '#87CEEB',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#87CEEB',
  },
};

const pieChartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out evenly
    paddingVertical: 10,
  },
  navButtonText: {
    fontSize: 16,
    color: '#000', // Black text
    fontWeight: 'bold',
  },
  underline: {
    borderBottomWidth: 2,           // Underline thickness
    borderBottomColor: '#000',      // Black underline
    paddingBottom: 5,               // Adds some spacing between text and underline
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
    marginVertical: 5,
    alignItems: 'center',
  },
  decorativeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartContainer: {
    marginVertical: 20,
    width: screenWidth * 1.25,
    alignItems: 'center',
  },

  averageSeverityText: {
    marginTop: 10,
    fontSize: 14,
    color: 'orange',
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
    textAlign: 'left',
    width: '80%',
  },
  chart: {
    borderRadius: 16,
  },
});

export default DetailsScreen;