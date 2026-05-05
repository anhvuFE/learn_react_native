import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import BackgroundOrbs from "./components/BackgroundOrbs";
import EmptyState from "./components/EmptyState";
import Header from "./components/Header";
import TodoInput from "./components/TodoInput";
import TodoItem from "./components/TodoItem";
import { INITIAL_TODOS, enableLayoutAnimationOnAndroid } from "./constants";
import type { Todo } from "./types";

enableLayoutAnimationOnAndroid();

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [input, setInput] = useState("");

  const { total, completed, progress } = useMemo(() => {
    const t = todos.length;
    const c = todos.filter((x) => x.done).length;
    return { total: t, completed: c, progress: t === 0 ? 0 : c / t };
  }, [todos]);

  const animateLayout = () =>
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );

  const addTodo = () => {
    const title = input.trim();
    if (!title) return;
    animateLayout();
    setTodos((prev) => [
      { id: Date.now().toString(), title, done: false },
      ...prev,
    ]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    animateLayout();
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const removeTodo = (id: string) => {
    animateLayout();
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <BackgroundOrbs />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Header total={total} completed={completed} progress={progress} />

        <TodoInput value={input} onChange={setInput} onSubmit={addTodo} />

        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item, index }) => (
            <TodoItem
              item={item}
              index={index}
              onToggle={toggleTodo}
              onRemove={removeTodo}
            />
          )}
        />

        <Text style={styles.hint}>
          Nhấn giữ task để xoá • Tap để hoàn thành
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1020" },
  flex: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24, gap: 10 },
  hint: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
});
