import os
import json

def process_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except json.JSONDecodeError:
        print(f"Error: {filepath} is not a valid JSON file.")
        return []
    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")
        return []

def main():
    merged_list = []
    input_dir = './converted_json'

    if not os.path.exists(input_dir):
        print(f"Error: Directory {input_dir} does not exist.")
        return

    for filename in os.listdir(input_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(input_dir, filename)
            stations = process_json(filepath)
            if stations:
                merged_list.extend(stations)
                print(f"Processed {len(stations)} stations from {filename}")

    # Remove duplicates and merge lines for stations with the same name
    unique_stations = {}
    for station in merged_list:
        if station['name'] in unique_stations:
            # Merge lines
            unique_stations[station['name']]['lines'].extend(station['lines'])
            unique_stations[station['name']]['lines'] = list(set(unique_stations[station['name']]['lines']))
        else:
            unique_stations[station['name']] = station

    # Convert back to list and sort by name
    final_stations = list(unique_stations.values())
    final_stations.sort(key=lambda x: x['name'])

    output_file = 'merged_list.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_stations, f, ensure_ascii=False, indent=4)

    print(f"Processing complete. {len(final_stations)} stations saved to {output_file}")

if __name__ == "__main__":
    main()

