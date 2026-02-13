"""Utilities to extract feature importance from trained models.

Supports:
- model.feature_importances_ (tree models)
- model.coef_ (linear models)
- optional SHAP values if shap is installed
"""

import numpy as np


def extract_feature_importance(model, feature_names, top_k=20):
    if hasattr(model, 'feature_importances_'):
        values = np.asarray(model.feature_importances_)
    elif hasattr(model, 'coef_'):
        coef = np.asarray(model.coef_)
        if coef.ndim > 1:
            coef = np.mean(np.abs(coef), axis=0)
        else:
            coef = np.abs(coef)
        values = coef
    else:
        raise ValueError('Model does not expose feature_importances_ or coef_.')

    pairs = sorted(zip(feature_names, values), key=lambda x: x[1], reverse=True)
    return pairs[:top_k]


def extract_shap_importance(model, X_sample, feature_names, top_k=20):
    """Optional SHAP-based importance. Raises ImportError if shap is unavailable."""
    import shap  # optional dependency

    explainer = shap.Explainer(model, X_sample)
    shap_values = explainer(X_sample)
    abs_mean = np.abs(shap_values.values).mean(axis=0)
    pairs = sorted(zip(feature_names, abs_mean), key=lambda x: x[1], reverse=True)
    return pairs[:top_k]
