from ortools.sat.python import cp_model
import numpy as np

print("Successfully imported ortools.sat.python.cp_model")
print("Successfully imported numpy")

# Test numpy functionality
print("NumPy version:", np.__version__)
print("NumPy array example:", np.array([1, 2, 3]))

# Test OR-Tools functionality
model = cp_model.CpModel()
print("Successfully created CP model")
