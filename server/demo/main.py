from rocketpy import Environment, Rocket, SolidMotor, NoseCone, TrapezoidalFins

# 1. Define basic rocket dimensions
body_length = 1.0  # metres, excluding the nose cone
nose_cone_length = 0.20  # metres

# Position of the body tail, measured from the nose tip
body_tail_position = -(nose_cone_length + body_length)


# 2. Create the environment
environment = Environment()
environment.set_atmospheric_model(type="standard_atmosphere")


# 3. Create the rocket
rocket = Rocket(
    radius=0.05,
    mass=10.0,
    inertia=(1.0, 1.0, 0.1),
    power_off_drag=0.5,
    power_on_drag=0.5,
    center_of_mass_without_motor=0.0,
    coordinate_system_orientation="tail_to_nose",
)

print("\nROCKET MODEL")
print("Radius:", rocket.radius, "m")
print("Mass without motor:", rocket.mass, "kg")
print("Frontal area:", rocket.area, "m²")


# 4. Create the motor
motor = SolidMotor(
    thrust_source=[
        [0.0, 0.0],
        [0.5, 100.0],
        [1.0, 100.0],
        [1.5, 0.0],
    ],
    dry_mass=1.0,
    dry_inertia=(0.01, 0.01, 0.001),
    nozzle_radius=0.02,
    grain_number=1,
    grain_density=1700.0,
    grain_outer_radius=0.03,
    grain_initial_inner_radius=0.01,
    grain_initial_height=0.10,
    grain_separation=0.0,
    grains_center_of_mass_position=0.15,
    center_of_dry_mass_position=0.10,
)

print("\nMOTOR GEOMETRY")
motor.info()

# Keep the existing motor position until we establish its correct placement
rocket.add_motor(motor, position=0.0)

print("\nMOTOR MODEL")
print("Dry mass:", motor.dry_mass, "kg")
print("Initial propellant mass:", motor.propellant_initial_mass, "kg")
print("Maximum thrust:", motor.max_thrust, "N")
print("Total impulse:", motor.total_impulse, "N·s")
print("Burn time:", motor.burn_time, "s")


# 5. Create and attach the nose cone
nose_cone = NoseCone(
    length=nose_cone_length,
    kind="ogive",
    base_radius=0.05,
    rocket_radius=0.05,
)

print("\nNOSE CONE")
print("Shape:", nose_cone.kind)
print("Length:", nose_cone.length, "m")
print("Base radius:", nose_cone.base_radius, "m")

nose_cone.info()

# Nose tip is our coordinate origin
rocket.add_surfaces(
    surfaces=nose_cone,
    positions=0.0,
)

print("\nNOSE CONE ATTACHED")
rocket.info()


# 6. Create and attach the fins
fins = TrapezoidalFins(
    n=4,
    root_chord=0.12,
    tip_chord=0.06,
    span=0.05,
    rocket_radius=0.05,
    name="Four Fins",
)

print("\nFIN SET")
print("Number of fins:", fins.n)
print("Root chord:", fins.root_chord, "m")
print("Tip chord:", fins.tip_chord, "m")
print("Span:", fins.span, "m")

fins.info()

# Position the fin root's leading edge so its trailing edge
# aligns with our body-tail reference
fin_position = body_tail_position + fins.root_chord

rocket.add_surfaces(
    surfaces=fins,
    positions=fin_position,
)

print("\nFIN SET ATTACHED")


# 7. Display the reference positions
print("\nROCKET COMPONENT POSITIONS")
print("Nose tip position: 0.0 m")
print("Nose base position:", -nose_cone_length, "m")
print("Body tail reference:", body_tail_position, "m")
print("Fin leading edge:", fin_position, "m")
print("Motor position: 0.0 m (existing setting; not yet verified)")


# 8. Check air density at different altitudes
print("\nAIR DENSITY")
print("Sea level:", environment.density(0), "kg/m³")
print("1000 metres:", environment.density(1000), "kg/m³")
print("5000 metres:", environment.density(5000), "kg/m³")


# from rocketpy import Environment, Rocket, SolidMotor, NoseCone, TrapezoidalFins

# body_length = 1.0  # metres, excluding the nose cone

# # Basic rocket dimensions
# body_length = 1.0  # metres, excluding the nose cone

# # Position of the body tail
# body_tail_position = -(0.20 + body_length)

# # Create the environment for our simulation
# environment = Environment()

# # Use the standard atmospheric model
# environment.set_atmospheric_model(type="standard_atmosphere")


# # creating rocket

# rocket = Rocket(
#     radius=0.05,
#     mass=10.0,
#     inertia=(1.0, 1.0, 0.1),
#     power_off_drag=0.5,
#     power_on_drag=0.5,
#     center_of_mass_without_motor=0.0,
#     coordinate_system_orientation="tail_to_nose",
# )


# # 3. Display the rocket's properties
# print("\nROCKET MODEL")
# print("Radius:", rocket.radius, "m")
# print("Mass without motor:", rocket.mass, "kg")
# print("Frontal area:", rocket.area, "m²")

# # 4. Display the rocket diagram
# # rocket.draw()


# motor = SolidMotor(
#     thrust_source=[
#         [0.0, 0.0],
#         [0.5, 100.0],
#         [1.0, 100.0],
#         [1.5, 0.0],
#     ],
#     dry_mass=1.0,
#     dry_inertia=(0.01, 0.01, 0.001),
#     nozzle_radius=0.02,
#     grain_number=1,
#     grain_density=1700.0,
#     grain_outer_radius=0.03,
#     grain_initial_inner_radius=0.01,
#     grain_initial_height=0.10,
#     grain_separation=0.0,
#     grains_center_of_mass_position=0.15,
#     center_of_dry_mass_position=0.10,
# )

# print("\nMOTOR GEOMETRY")
# motor.info()

# rocket.add_motor(motor, position=0.0)

# # Display basic motor properties
# print("\nMOTOR MODEL")
# print("Dry mass:", motor.dry_mass, "kg")
# print("Initial propellant mass:", motor.propellant_initial_mass, "kg")
# print("Maximum thrust:", motor.max_thrust, "N")
# print("Total impulse:", motor.total_impulse, "N·s")
# print("Burn time:", motor.burn_time, "s")


# # Create the rocket's nose cone
# nose_cone = NoseCone(
#     length=0.20,
#     kind="ogive",
#     base_radius=0.05,
#     rocket_radius=0.05,
# )

# print("\nNOSE CONE")
# print("Shape:", nose_cone.kind)
# print("Length:", nose_cone.length, "m")
# print("Base radius:", nose_cone.base_radius, "m")

# nose_cone.info()

# rocket.add_surfaces(
#     surfaces=nose_cone,
#     positions=0.0,
# )

# print("\nNOSE CONE ATTACHED")
# rocket.info()


# # Create a trapezoidal fin set
# fins = TrapezoidalFins(
#     n=4,
#     root_chord=0.12,
#     tip_chord=0.06,
#     span=0.05,
#     rocket_radius=0.05,
#     name="Four Fins",
# )

# print("\nFIN SET")
# print("Number of fins:", fins.n)
# print("Root chord:", fins.root_chord, "m")
# print("Tip chord:", fins.tip_chord, "m")
# print("Span:", fins.span, "m")

# fins.info()


# rocket.add_surfaces(
#     surfaces=fins,
#     positions=body_tail_position + fins.root_chord,
# )


# print("\nFIN SET ATTACHED")

# # Display the environment information
# # environment.info()

# # Check air density at different altitudes
# print("Air density at sea level:")
# print(environment.density(0), "kg/m³")

# print("Air density at 1000 metres:")
# print(environment.density(1000), "kg/m³")

# print("Air density at 5000 metres:")
# print(environment.density(5000), "kg/m³")
