import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';

const PostDetails = ({ route }) => {
  const { post } = route.params;
  const { width } = useWindowDimensions();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{post.title.rendered}</Text>

      {/* Render HTML content with images in their original positions */}
      <RenderHTML
        contentWidth={width}
        source={{ html: post.content.rendered }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
});

export default PostDetails;