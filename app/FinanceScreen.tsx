import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, G, Svg } from 'react-native-svg';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
const { width } = Dimensions.get('window');

// Type definitions
interface ExpenseData {
  category: string;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: ExpenseData[];
}

interface ButtonProps {
  icon: string;
  label: string;
  isActive?: boolean;
  iconColor?: string;
}

const FinanceScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Dữ liệu mẫu
  const userData = {
    name: 'Nguyen Manh Cuong',
    balance: '2,100,000',
    income: '80,000',
    expenses: '1,980,000',
    difference: '-1,900,000'
  };

  const expenseData: ExpenseData[] = [
    { category: 'Leisure', percentage: 54.55, color: '#FFA726' },
    { category: 'Self-development', percentage: 25.25, color: '#EF5350' },
    { category: 'Clothing', percentage: 18.74, color: '#26A69A' },
    { category: 'Food', percentage: 0.76, color: '#AB47BC' },
    { category: 'Undefined', percentage: 0.7, color: '#42A5F5' },
  ];

  // Component biểu đồ tròn
  const PieChart = ({ data }: PieChartProps) => {
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    let cumulativePercentage = 0;

    const createArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", centerX, centerY,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
      ].join(" ");
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    return (
      <View style={styles.chartContainer}>
        <Svg width={200} height={200}>
          {data.map((item: ExpenseData, index: number) => {
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + item.percentage) * 3.6;
            cumulativePercentage += item.percentage;

            return (
              <G key={index}>
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={20}
                  strokeDasharray={`${item.percentage * 5.03} ${500}`}
                  strokeDashoffset={-startAngle * 1.4}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                />
              </G>
            );
          })}
          {/* Vòng tròn trắng ở giữa */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={50}
            fill="white"
          />
        </Svg>
      </View>
    );
  };

  const IconButton = ({ icon, label, isActive = false, iconColor = 'white' }: ButtonProps) => (
    <TouchableOpacity style={[styles.iconButton, isActive && styles.activeIconButton]}>
      <View style={styles.iconContainer}>
        {icon.startsWith('M') ? (
          <Icon name={icon} size={24} color={iconColor} />
        ) : (
          <Text style={[styles.iconText, { color: iconColor }]}>{icon}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const BottomTabButton = ({ icon, label, isActive = false }: ButtonProps) => (
    <TouchableOpacity style={styles.bottomTabButton}>
      <Text style={[styles.bottomTabIcon, isActive && styles.activeBottomTabIcon]}>{icon}</Text>
      <Text style={[styles.bottomTabLabel, isActive && styles.activeBottomTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285F4" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello!</Text>
              <Text style={styles.userName}>{userData.name}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="refresh" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="notifications" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceAmount, { minWidth: 200 }]}>
              {isBalanceVisible ? `${userData.balance} đ` : '********'}
            </Text>
            <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)}>
              <Icon 
                name={isBalanceVisible ? "visibility" : "visibility-off"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Income and Expenses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income and Expenses</Text>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>{selectedPeriod}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Bar Chart */}
          <View style={styles.barChartContainer}>
            <View style={styles.barChart}>
              <View style={styles.incomeBar}>
                <Text style={styles.barLabel}>Inco</Text>
              </View>
              <View style={styles.expenseBar}>
                <Text style={styles.barLabel}>Exp</Text>
              </View>
              <Text style={styles.differenceLabel}>Difference</Text>
            </View>
            
            <View style={styles.amountsList}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Income</Text>
                <Text style={styles.incomeAmount}>{userData.income} đ</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Exp</Text>
                <Text style={styles.expenseAmount}>{userData.expenses} đ</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Difference</Text>
                <Text style={styles.differenceAmount}>{userData.difference} đ</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pie Chart Section */}
        <View style={styles.section}>
          <View style={styles.pieChartSection}>
            <PieChart data={expenseData} />
            <View style={styles.legendContainer}>
              {expenseData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.category}</Text>
                  <Text style={styles.legendPercentage}>{item.percentage} %</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="calendar-month" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon2 name="robot" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="wallet" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <BottomTabButton icon="🏠" label="Overview" isActive={true} />
        <BottomTabButton icon="💳" label="Wallet" />
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <BottomTabButton icon="📊" label="Report" />
        <BottomTabButton icon="⚙️" label="Setting" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4285F4',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
  },
  greeting: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
  },
  headerIconText: {
    color: 'white',
    fontSize: 20,
  },
  balanceSection: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 15,
  },
  eyeIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  incomeBar: {
    width: 30,
    height: 40,
    backgroundColor: '#4CAF50',
    marginRight: 10,
    borderRadius: 4,
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  expenseBar: {
    width: 30,
    height: 120,
    backgroundColor: '#F44336',
    marginRight: 20,
    borderRadius: 4,
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  differenceLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  amountsList: {
    flex: 1,
    paddingLeft: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  incomeAmount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  differenceAmount: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  pieChartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  legendPercentage: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 20,
  },
  iconButton: {
    width: 60,
    height: 60,
    backgroundColor: '#1e90ff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconButton: {
    backgroundColor: '#1976D2',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    color: 'white',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bottomTabButton: {
    alignItems: 'center',
    flex: 1,
  },
  bottomTabIcon: {
    fontSize: 20,
    color: '#999',
    marginBottom: 4,
  },
  activeBottomTabIcon: {
    color: '#4285F4',
  },
  bottomTabLabel: {
    fontSize: 10,
    color: '#999',
  },
  activeBottomTabLabel: {
    color: '#4285F4',
    fontWeight: '600',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#1e90ff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
});

export default FinanceScreen; 