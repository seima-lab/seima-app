import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, G, Svg, Text as SvgText } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootStackParamList } from '../navigation/types';
import { ReportByCategory } from '../services/transactionService';
import { getIconColor, getIconForCategory } from '../utils/iconUtils';


const { width } = Dimensions.get('window');

// Type definition for the route params
type ReportDetailScreenRouteProp = RouteProp<RootStackParamList, 'ReportDetailScreen'>;

// Helper to convert polar coordinates to Cartesian
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

interface DetailedPieChartProps {
  data: (ReportByCategory & { color: string })[];
  categoryType: 'expense' | 'income';
}

// Clean pie chart component
const DetailedPieChart: React.FC<DetailedPieChartProps> = ({ data, categoryType }) => {
  const size = width * 0.8;
  const radius = size * 0.35;
  const strokeWidth = size * 0.15;

  let cumulativePercentage = 0;

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {data.map((item, index) => {
            if (item.percentage <= 0) return null;

            const segmentLength = (item.percentage / 100) * (2 * Math.PI * radius);
            const rotationAngle = (cumulativePercentage / 100) * 360;
            
            // Calculate midpoint of the segment for text positioning
            const midAngle = rotationAngle + (item.percentage / 100) * 180;
            const textPosition = polarToCartesian(size / 2, size / 2, radius, midAngle);

            cumulativePercentage += item.percentage;

            return (
              <G key={index}>
                {/* Pie Segment */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLength} ${2 * Math.PI * radius}`}
                  strokeLinecap="butt"
                  fill="transparent"
                  transform={`rotate(${rotationAngle - 90}, ${size / 2}, ${size / 2})`}
                />
                
                {/* Percentage Text inside segment */}
                {item.percentage > 5 && ( // Only show text if segment is large enough
                  <SvgText
                    x={textPosition.x}
                    y={textPosition.y + 5} // Slight vertical offset for better centering
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {`${item.percentage.toFixed(1)}%`}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.category_name}
            </Text>
            <Text style={styles.legendPercentage}>
              {item.percentage.toFixed(2)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};


const ReportDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ReportDetailScreenRouteProp>();
  const { t } = useTranslation();

  const { title, categoryType, data, totalAmount } = route.params;

  const dailyAverage = totalAmount / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const chartData = data.map(item => {
    // Use category_icon_url (from database) instead of categoryName (display name)
    const iconName = getIconForCategory(item.category_icon_url, categoryType);
    const iconColor = getIconColor(iconName, categoryType);
    
    console.log('🎨 Report Color Mapping:', {
      categoryName: item.category_name,
      category_icon_url: item.category_icon_url,
      categoryType,
      iconName,
      iconColor,
      amount: item.amount
    });
    
    return {
      ...item,
      color: iconColor,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DetailedPieChart data={chartData} categoryType={categoryType} />
        
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('reports.total')}</Text>
            <Text style={styles.summaryAmount}>{totalAmount.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('reports.dailyAverage')}</Text>
            <Text style={styles.summaryAmount}>{Math.round(dailyAverage).toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listHeader}>{t('reports.categories')}</Text>
          {chartData.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}>
                <Icon name={getIconForCategory(item.category_icon_url, categoryType)} size={20} color={item.color} />
              </View>
              <Text style={styles.itemName}>{item.category_name}</Text>
              <Text style={styles.itemAmount}>{item.amount.toLocaleString('vi-VN')} đ</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 16 },
  chartContainer: { alignItems: 'center', marginVertical: 30 },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryAmount: { fontSize: 16, fontWeight: '600', color: '#333' },
  listSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  listHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: { flex: 1, fontSize: 16, color: '#333' },
  itemAmount: { fontSize: 16, fontWeight: '500', color: 'red' },
  legendContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: { 
    flex: 1, 
    fontSize: 14, 
    color: '#333' 
  },
  legendPercentage: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#666' 
  },
});

export default ReportDetailScreen; 