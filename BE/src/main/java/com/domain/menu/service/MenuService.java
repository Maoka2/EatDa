package com.domain.menu.service;

import com.domain.menu.entity.Menu;
import java.util.List;

public interface MenuService {
    List<Menu> getMenuList(Long storeId);
}
