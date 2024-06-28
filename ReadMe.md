# USE CASE
This programs design and intent is to explicitly capture every message sent by Austin in the Skin Walkers server. All others will be ignored.

The main.py file is used for discord client handling, this is where all messages are filtered. If a message does not come from Austin the program immediately cancels its operation and returns to the waiting state.

The database.py file is used for managing the data in the database. This is where all reading and writing is and will continue to occur. More features will be added in the future.

# Installation
Python 3.11.5

Virtual Environment Creation:
```bash
python3.11 -m venv venv
venv/Scripts/activate
```

Optional: Only for development and ease of commits.
```bash
pip install commitizen
```

Dependencies:
```bash
pip install discord.py
pip install requirements.txt
```

