import sys 
import os
import pandas as pd
from dataclasses import dataclass
from src.logger import logging
from src.exception import CustomException
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from src.utils import TextPreprocessor,save_object

@dataclass
class DataTransformationConfig:
    preprocess_obj_file_path = os.path.join('artifacts','preprocess.pkl')

class DataTransformation:
    def __init__(self):
        self.data_transformation_config = DataTransformationConfig()
    
    def get_data_transformer_obj(self):
        try:
            text_column = "text"  
            
            logging.info("Initiating pipeline")

            pipeline = Pipeline(
                steps=[
                    ("text_preprocessing", TextPreprocessor()),  
                    ("vectorize", TfidfVectorizer())            
                ]
            )

            preprocessor = ColumnTransformer(
                transformers=[
                    ("text_pipeline", pipeline, text_column)
                ],
                remainder='drop' 
            )
            
            return preprocessor

        except Exception as e:
            raise CustomException(e,sys)
        
    def initiate_data_transformation(self,train_path,test_path):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)
            preprocessing_obj = self.get_data_transformer_obj()
            target_column_name="target"
         
            input_feature_train_df=train_df.drop(columns=[target_column_name],axis=1)
            target_feature_train_df=train_df[target_column_name]

            input_feature_test_df=test_df.drop(columns=[target_column_name],axis=1)
            target_feature_test_df=test_df[target_column_name]

            logging.info(
                "Applying preprocessing object on training dataframe and testing dataframe."
            )

            input_feature_train_df=preprocessing_obj.fit_transform(input_feature_train_df)
            input_feature_test_df=preprocessing_obj.transform(input_feature_test_df)

            logging.info("Saved preprocessing object.")

            save_object(

                file_path=self.data_transformation_config.preprocess_obj_file_path,
                obj=preprocessing_obj

            )
            #print("X_train shape:", input_feature_train_df.shape)
            #print("y_train shape:", target_feature_train_df.shape)
            #print("X_test shape:", input_feature_test_df.shape)
            #print("y_test shape:", target_feature_test_df.shape)

            return (
                input_feature_train_df,
                target_feature_train_df,
                input_feature_test_df,
                target_feature_test_df,
                self.data_transformation_config.preprocess_obj_file_path
            )

        except Exception as e:
            raise CustomException(e,sys)