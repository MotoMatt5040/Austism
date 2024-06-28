import sqlite3
import random

class Database:
    def __init__(self):
        self.conn = sqlite3.connect("skin_walkers.db")
        self.cur = self.conn.cursor()

    def initialize_server(self, server_id: str):
        parameters = f'message_id, content, rec_date, attachment, embed'
        self.cur.execute(f"CREATE TABLE IF NOT EXISTS tbl{server_id}({parameters})")

    def insert_message(self, server_id: str,  message_id, content, rec_date, attachment, embed):
        parameters = [message_id, content, rec_date, str(attachment), str(embed)]
        sql = f"INSERT INTO tbl{server_id}(message_id, content, rec_date, attachment, embed) VALUES (?, ?, ?, ?, ?)"
        self.cur.execute(sql, parameters)
        self.conn.commit()

    def get_random_message(self, server_id: str = None):
        if server_id is None:
            server_id = 'Skin_Walkers'
        sql = f"SELECT * FROM tbl{server_id}"
        exe = self.cur.execute(sql)
        data = exe.fetchall()

        random_selection = data[random.randint(0, len(data) - 1)]
        message = {
            "message_id": random_selection[0],
            "content": random_selection[1],
            "rec_date": random_selection[2],
            "attachment": random_selection[3],
            "embed": random_selection[4]
        }

        return message
