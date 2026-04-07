import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, WEEK, trMonthLabel, dayToDateStr } from "./calendarUtils";

/**
 * Reusable monthly calendar grid.
 *
 * Props:
 *  cursor       – Date  – currently displayed month
 *  rows         – Day[][] – output of buildMonthGrid(cursor)
 *  selected     – "YYYY-MM-DD" – highlighted date
 *  availability – { [dateStr]: "musait" | "dolu" } – optional dot indicators
 *  onPrevMonth  – () => void
 *  onNextMonth  – () => void
 *  onPickDay    – (day: number | null) => void
 */
export default function CalendarCard({
  cursor,
  rows,
  selected,
  availability,
  onPrevMonth,
  onNextMonth,
  onPickDay,
}) {
  return (
    <View style={styles.calOuter}>
      {/* Month navigation */}
      <View style={styles.calTopRow}>
        <TouchableOpacity
          style={styles.chevBtn}
          activeOpacity={0.9}
          onPress={onPrevMonth}
        >
          <Ionicons name="chevron-back" size={18} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.monthText}>{trMonthLabel(cursor)}</Text>

        <TouchableOpacity
          style={styles.chevBtn}
          activeOpacity={0.9}
          onPress={onNextMonth}
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEK.map((w) => (
          <Text key={w} style={styles.weekText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={`r-${ri}`} style={styles.gridRow}>
            {row.map((day, ci) => {
              const dateStr = dayToDateStr(cursor, day);
              const isSelected = !!dateStr && dateStr === selected;
              const avail = dateStr ? availability?.[dateStr] : null;

              return (
                <TouchableOpacity
                  key={`c-${ri}-${ci}`}
                  activeOpacity={day ? 0.92 : 1}
                  onPress={() => onPickDay(day)}
                  style={[
                    styles.dayCell,
                    !day && styles.dayCellEmpty,
                    isSelected && styles.dayCellSelected,
                  ]}
                >
                  {day ? (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                      {/* Availability dot — hidden on selected cell */}
                      {avail && !isSelected && (
                        <View
                          style={[
                            styles.availDot,
                            {
                              backgroundColor:
                                avail === "musait"
                                  ? COLORS.success
                                  : COLORS.danger,
                            },
                          ]}
                        />
                      )}
                    </>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calOuter: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
  },
  calTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
    opacity: 0.95,
  },
  chevBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekText: {
    width: "14.28%",
    textAlign: "center",
    color: "rgba(234,244,255,0.42)",
    fontWeight: "800",
    fontSize: 11,
  },
  grid: { gap: 10 },
  gridRow: { flexDirection: "row", justifyContent: "space-between" },
  dayCell: {
    width: "14.28%",
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellEmpty: { backgroundColor: "transparent", borderColor: "transparent" },
  dayCellSelected: {
    backgroundColor: "rgba(255,204,114,0.95)",
    borderColor: "rgba(255,204,114,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  dayText: { color: COLORS.text, fontWeight: "900", fontSize: 12 },
  dayTextSelected: { color: "#0B1220" },
  availDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 6,
  },
});
