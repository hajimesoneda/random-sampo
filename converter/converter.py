import os
import json

# Directories for input and output
input_dir = os.path.join(os.getcwd(), "geojson")
output_dir = os.path.join(os.getcwd(), "converted_json")

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Get all GeoJSON files in the input directory
geojson_files = [f for f in os.listdir(input_dir) if f.endswith('.geojson')]

for geojson_file in geojson_files:
    input_file = os.path.join(input_dir, geojson_file)
    output_file = os.path.join(output_dir, geojson_file.replace('.geojson', '.json'))

    # Read the GeoJSON file
    with open(input_file, "r", encoding="utf-8") as file:
        geojson_data = json.load(file)

    # Output dictionary to hold station data by unique id
    station_dict = {}

    # Parse GeoJSON features and convert to required format
    for feature in geojson_data["features"]:
        properties = feature["properties"]
        geometry = feature["geometry"]

        # Extract relevant fields
        station_name = properties.get("name", "不明な駅")
        line_name = properties.get("name", "").split("/")[-1]  # Simplified line extraction
        coordinates = geometry.get("coordinates", [])

        # If coordinates are valid, assign lat/lng
        if coordinates and isinstance(coordinates[0], list):
            lng, lat = coordinates[0][0], coordinates[0][1]  # Adjust to single point if multi-coordinates
        else:
            lat, lng = None, None

        # Create a unique id (using station name as an example; adjust if needed)
        station_id = station_name.lower()

        # Check if the station already exists in the dictionary
        if station_id in station_dict:
            # Update lines if new line is found
            if line_name not in station_dict[station_id]["lines"]:
                station_dict[station_id]["lines"].append(line_name)
        else:
            # Add new station to the dictionary
            station_dict[station_id] = {
                "id": station_id,
                "name": station_name,
                "lines": [line_name],
                "passengers": None,  # Replace with actual data if available
                "firstDeparture": None,  # Replace with actual data if available
                "lat": lat,
                "lng": lng
            }

    # Convert the dictionary values to a list
    stations = list(station_dict.values())

    # Write the converted JSON to a file
    with open(output_file, "w", encoding="utf-8") as outfile:
        json.dump(stations, outfile, ensure_ascii=False, indent=4)

    print(f"Converted data saved to {output_file}")
