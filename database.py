import sqlite3
import discord
import traceback

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
