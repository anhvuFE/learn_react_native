import { useMutation } from "@apollo/client";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "../components/icons";
import RewardPicker from "../components/RewardPicker";
import RewardsRow from "../components/RewardsRow";
import { beRewardType } from "../lib/normalize";
import {
  MY_BANK_QUERY,
  MY_REWARDS_QUERY,
  REQUEST_PHOTO_UPLOAD,
  SUBMIT_PHOTO,
} from "../lib/queries";
import { colors, styles } from "../theme/styles";
import { RewardType, Task } from "../types";

type Stage =
  | "intro"
  | "review"
  | "waiting"
  | "approved"
  | "rejected";

interface Props {
  task: Task;
  reward: RewardType;
  onChangeReward: (r: RewardType) => void;
  onApproved: (reward: RewardType) => void;
  onCancel: () => void;
}

const PhotoTask: React.FC<Props> = ({
  task,
  reward,
  onChangeReward,
  onApproved,
  onCancel,
}) => {
  const [stage, setStage] = useState<Stage>("intro");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [submitPhoto] = useMutation(SUBMIT_PHOTO, {
    refetchQueries: [{ query: MY_BANK_QUERY }, { query: MY_REWARDS_QUERY }],
  });
  const [requestPhotoUpload] = useMutation<{
    requestPhotoUpload: {
      storagePath: string;
      uploadUrl: string;
      contentType: string;
    };
  }>(REQUEST_PHOTO_UPLOAD);

  const hourglassRotate = useRef(new Animated.Value(0)).current;
  const approvedScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (stage === "waiting") {
      const loop = Animated.loop(
        Animated.timing(hourglassRotate, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => {
        loop.stop();
        hourglassRotate.setValue(0);
      };
    }
  }, [stage, hourglassRotate]);

  useEffect(() => {
    if (stage === "approved") {
      Animated.spring(approvedScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      approvedScale.setValue(0.5);
    }
  }, [stage, approvedScale]);

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera permission",
        "We need camera access to take a photo for your mission.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStage("review");
    }
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Gallery permission",
        "We need gallery access to pick a photo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStage("review");
    }
  }

  function chooseSource() {
    Alert.alert(
      "Add a photo",
      "How would you like to add your photo?",
      [
        { text: "Take photo", onPress: pickFromCamera },
        { text: "Choose from gallery", onPress: pickFromGallery },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  }

  async function submit() {
    if (!photoUri) {
      Alert.alert("No photo", "Take or pick a photo first");
      return;
    }
    setStage("waiting");
    try {
      // 1. Get signed PUT URL from BE
      const { data: uploadData } = await requestPhotoUpload({
        variables: { input: { taskId: task.id } },
      });
      const upload = uploadData?.requestPhotoUpload;
      if (!upload) throw new Error("No upload URL returned");

      // 2. Upload photo bytes via signed PUT (expo-file-system handles file:// URIs)
      const putRes = await FileSystem.uploadAsync(
        upload.uploadUrl,
        photoUri,
        {
          httpMethod: "PUT",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { "Content-Type": upload.contentType },
        },
      );
      if (putRes.status >= 300) {
        throw new Error(`Upload failed (${putRes.status}): ${putRes.body?.slice(0, 200) ?? ""}`);
      }

      // 3. Tell BE the path is ready — BE creates PENDING submission
      await submitPhoto({
        variables: {
          input: {
            taskId: task.id,
            chosenReward: beRewardType(reward),
            photoStoragePath: upload.storagePath,
          },
        },
      });
      // Submission is now PENDING — wait for parent review.
      // Stay on "waiting" stage; child can leave the screen.
    } catch (e) {
      Alert.alert("Submit failed", (e as Error).message);
      setStage("review");
    }
  }

  if (stage === "intro") {
    return (
      <View>
        <View
          style={[
            styles.illustrationBox,
            { backgroundColor: colors.warningSoft },
          ]}
        >
          <Ionicons name="bed" size={88} color={colors.warning} />
        </View>
        <Text style={styles.taskHeadline}>{task.description}</Text>

        <RewardsRow rewards={task.rewards} />

        <Text style={styles.rewardChooseLabel}>Choose your reward</Text>
        <RewardPicker
          rewards={task.rewards}
          selected={reward}
          onChange={onChangeReward}
        />

        <Pressable
          onPress={chooseSource}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Ionicons
            name="camera"
            size={16}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryButtonText}>Take photo</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === "review" && photoUri) {
    return (
      <View>
        <View
          style={[styles.cameraFrame, { backgroundColor: "#000" }]}
        >
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View style={styles.cameraTopBar}>
            <Pressable
              onPress={() => {
                setPhotoUri(null);
                setStage("intro");
              }}
              style={styles.cameraIconBtn}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
        <View style={styles.photoActionRow}>
          <Pressable
            onPress={chooseSource}
            style={({ pressed }) => [
              styles.ghostButton,
              styles.photoActionGhost,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={colors.text}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.ghostButtonText}>Retake</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.photoActionPrimary,
              { backgroundColor: colors.warning },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons
              name="paper-plane"
              size={16}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>Submit</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (stage === "waiting") {
    const rotateStr = hourglassRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });
    return (
      <View>
        {photoUri && (
          <View
            style={[
              styles.cameraFrame,
              { aspectRatio: 4 / 3, marginBottom: 18 },
            ]}
          >
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        )}
        <View style={styles.hourglassWrap}>
          <Animated.View style={{ transform: [{ rotate: rotateStr }] }}>
            <Ionicons name="hourglass" size={88} color={colors.accent} />
          </Animated.View>
        </View>
        <Text style={styles.pendingTitle}>Waiting for approval</Text>
        <Text style={styles.pendingText}>
          Your parent is reviewing your photo. You'll be notified here!
        </Text>
      </View>
    );
  }

  if (stage === "approved") {
    return (
      <View>
        {photoUri && (
          <View
            style={[
              styles.cameraFrame,
              { aspectRatio: 4 / 3, marginBottom: 14 },
            ]}
          >
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          </View>
        )}
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: approvedScale }],
            marginBottom: 12,
          }}
        >
          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
        </Animated.View>
        <Text style={styles.taskHeadline}>Approved by parent!</Text>
        <Pressable
          onPress={() => onApproved(reward)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  // rejected
  return (
    <View>
      {photoUri && (
        <View
          style={[
            styles.cameraFrame,
            { aspectRatio: 4 / 3, marginBottom: 14 },
          ]}
        >
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: "100%", opacity: 0.5 }}
            resizeMode="cover"
          />
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </View>
        </View>
      )}
      <Text style={styles.taskHeadline}>Rejected</Text>
      <Text style={styles.pendingText}>
        Parent asked you to retake. Try again!
      </Text>
      <View style={{ height: 16 }} />
      <Pressable
        onPress={chooseSource}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Ionicons
          name="refresh"
          size={16}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.primaryButtonText}>Retake</Text>
      </Pressable>
      <View style={{ height: 8 }} />
      <Pressable onPress={onCancel} style={styles.ghostButton}>
        <Text style={styles.ghostButtonText}>Back to missions</Text>
      </Pressable>
    </View>
  );
};

export default PhotoTask;
