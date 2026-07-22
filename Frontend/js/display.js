async function handleSegment(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch("http://localhost:8000/segment", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  // Convert bytes back to image
  const blob = new Blob([new Uint8Array(data.segmented_image)], { type: "image/png" });
  const imageUrl = URL.createObjectURL(blob);
  setSegmentedImage(imageUrl);
}
