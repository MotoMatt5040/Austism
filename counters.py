from dataclasses import dataclass


@dataclass(init=False)
class Counters:
    respond_to_austin_counter: int = 0
