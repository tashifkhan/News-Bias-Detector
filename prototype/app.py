import streamlit as st
from src.pipeline.predict_pipeline import PredictPipeline,CustomData

predict_pipeline = PredictPipeline()

txt = st.text_area("Enter the news",key = "news")

data = CustomData(
    text = txt
)

pred_df = data.get_data_as_data_frame()

if 'clicked' not in st.session_state:
    st.session_state.clicked = False

def click_button():
    st.session_state.clicked = True

st.button("Predict",use_container_width=True,on_click=click_button)

if st.session_state.clicked:

    result = predict_pipeline.predict(pred_df)

    if result == 0:
        st.write("Left Wing")
    else:
        st.write("Right Wing")
