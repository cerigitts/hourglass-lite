# utils/model_updater.py
# fits compression ratio model from logged data and saves coefficients to JSON silently

import pandas as pd
import numpy as np
import json
from pathlib import Path
import warnings

LOG_FILE = Path("logs/gif_data_log.csv")
CONFIG_FILE = Path("config/model_coeffs.json")

def fit_and_save_model(log_file=LOG_FILE, config_file=CONFIG_FILE):
    # suppress all warnings during polyfit to avoid RankWarning issues
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        
        # read logged data
        df = pd.read_csv(log_file)
        
        # calculate compression ratio
        df["compression_ratio"] = df["actual_size_mb"] / df["raw_size_mb"]
        
        # drop invalid rows
        df = df.dropna(subset=["fps", "compression_ratio"])
        
        # data for regression
        X = df["fps"].values
        y = df["compression_ratio"].values
        
        # fit quadratic model
        coeffs = np.polyfit(X, y, 2)
        a, b, c = coeffs
        
        # ensure config folder exists
        config_file.parent.mkdir(exist_ok=True)
        
        # save to JSON
        with open(config_file, "w") as f:
            json.dump({"a": a, "b": b, "c": c}, f, indent=4)

if __name__ == "__main__":
    fit_and_save_model()
