import React from "react";
import { View } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { COLORS } from "../constants/colors";
import { styles } from "../styles/home.styles";

export default function DonutChart({ data }) {
  const size = 140;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90;

  return (
    <View style={styles.donutChartWrapper}>
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${centerX}, ${centerY}`}>
          {data.map((item, index) => {
            const percentage = item.percentage / 100;
            const strokeDasharray = `${
              circumference * percentage
            } ${circumference}`;
            const rotation = currentAngle;
            currentAngle += percentage * 360;

            return (
              <Circle
                key={index}
                cx={centerX}
                cy={centerY}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                rotation={rotation}
                origin={`${centerX}, ${centerY}`}
              />
            );
          })}
        </G>

        <SvgText
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          fontSize="22"
          fontWeight="900"
          fill={COLORS.text}
        >
          {data.reduce((sum, item) => sum + item.value, 0)}
        </SvgText>

        <SvgText
          x={centerX}
          y={centerY + 12}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={COLORS.muted}
        >
          Toplam
        </SvgText>
      </Svg>
    </View>
  );
}
