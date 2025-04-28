import sys
print(f"Python executable: {sys.executable}")
print(f"Python path: {sys.path}")

try:
    from scipy.stats import chi2_contingency
    print("Successfully imported chi2_contingency from scipy.stats")
except ImportError as e:
    print(f"Error importing chi2_contingency: {e}") 