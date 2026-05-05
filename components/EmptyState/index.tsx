import { Text, View } from "react-native";
import { styles } from "./styles";

export default function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🎉</Text>
      <Text style={styles.emptyText}>Hết việc rồi, nghỉ thôi!</Text>
    </View>
  );
}
