import cv2
import numpy as np

out = cv2.VideoWriter('mock_video.mp4', cv2.VideoWriter_fourcc(*'mp4v'), 10, (640, 480))

for i in range(50):
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    # Give a rectangle in the middle
    cv2.rectangle(frame, (200, 100), (440, 380), (255, 255, 255), 2)
    # Add text "Mock Person"
    cv2.putText(frame, "Mock Person", (200, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    out.write(frame)

out.release()
print("mock_video.mp4 created")
