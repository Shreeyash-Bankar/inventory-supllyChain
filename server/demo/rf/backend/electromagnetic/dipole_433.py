
import os
import numpy as np

from CSXCAD import ContinuousStructure
from openEMS import openEMS
from openEMS.physical_constants import C0


# ----------------------------------
# 1. Simulation configuration
# ----------------------------------

FREQUENCY = 433e6
FREQUENCY_STOP = 600e6

UNIT = 1e-3  # All geometry dimensions are in millimetres

WAVELENGTH = C0 / FREQUENCY

# Initial practical dipole length
DIPOLE_LENGTH = 0.48 * WAVELENGTH / UNIT

# Small gap between the two antenna arms
FEED_GAP = 2.0  # mm

FEED_RESISTANCE = 50  # Ohms

SIMULATION_PATH = os.path.join(
    os.getcwd(),
    "backend",
    "results",
    "dipole_433"
)

os.makedirs(SIMULATION_PATH, exist_ok=True)


# ----------------------------------
# 2. Create the FDTD solver
# ----------------------------------

FDTD = openEMS(
    NrTS=30000,
    EndCriteria=1e-5
)

FDTD.SetGaussExcite(0, FREQUENCY_STOP)

FDTD.SetBoundaryCond(["PML_8"] * 6)


# ----------------------------------
# 3. Create the geometry container
# ----------------------------------

CSX = ContinuousStructure()

FDTD.SetCSX(CSX)

mesh = CSX.GetGrid()
mesh.SetDeltaUnit(UNIT)


# ----------------------------------
# 4. Create the dipole antenna
# ----------------------------------

dipole = CSX.AddMetal("Dipole")

half_length = DIPOLE_LENGTH / 2
half_gap = FEED_GAP / 2

# Lower antenna arm
dipole.AddBox(
    [-0.5, -0.5, -half_length],
    [0.5, 0.5, -half_gap]
)

# Upper antenna arm
dipole.AddBox(
    [-0.5, -0.5, half_gap],
    [0.5, 0.5, half_length]
)


# ----------------------------------
# 5. Configure the antenna feed
# ----------------------------------

mesh.AddLine("x", [-0.5, 0, 0.5])
mesh.AddLine("y", [-0.5, 0, 0.5])

mesh.AddLine(
    "z",
    [-half_length, -half_gap, 0, half_gap, half_length]
)

port = FDTD.AddLumpedPort(
    port_nr=1,
    R=FEED_RESISTANCE,
    start=[-0.5, -0.5, -half_gap],
    stop=[0.5, 0.5, half_gap],
    p_dir="z",
    excite=True
)



# ----------------------------------
# 6. Simulation environment
# ----------------------------------

# Highest frequency used in the excitation
LAMBDA_MIN = C0 / FREQUENCY_STOP / UNIT

# Mesh resolution: approximately 20 cells per
# shortest wavelength
MESH_RESOLUTION = LAMBDA_MIN / 20

# Create mesh lines around the antenna
mesh.AddLine("x", [-200, 200])
mesh.AddLine("y", [-200, 200])
mesh.AddLine("z", [-250, 250])

# Smooth mesh to avoid excessively large changes
# between neighbouring cells
mesh.SmoothMeshLines(
    "all",
    MESH_RESOLUTION,
    1.4
)



# ----------------------------------
# 7. Execute electromagnetic simulation
# ----------------------------------

print("\nStarting RF simulation...")
print(f"Output directory: {SIMULATION_PATH}")

# Save geometry as XML for inspection
CSX_FILE = os.path.join(
    SIMULATION_PATH,
    "dipole_433.xml"
)

CSX.Write2XML(CSX_FILE)

# Execute the FDTD solver
FDTD.Run(
    SIMULATION_PATH,
    cleanup=True
)

print("\nSimulation completed successfully!")




# ----------------------------------
# 8. Print configuration
# ----------------------------------

print("RF LAB - Dipole Configuration")
print("--------------------------------")
print(f"Frequency: {FREQUENCY / 1e6:.2f} MHz")
print(f"Wavelength: {WAVELENGTH / UNIT:.2f} mm")
print(f"Dipole length: {DIPOLE_LENGTH:.2f} mm")
print(f"Each arm: {half_length - half_gap:.2f} mm")
print(f"Feed gap: {FEED_GAP:.2f} mm")
print(f"Feed resistance: {FEED_RESISTANCE} Ohms")
print("--------------------------------")
